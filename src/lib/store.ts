import { promises as fs } from "fs";
import path from "path";
import { applyFanPayouts, applyPayouts, liveEntries } from "./ranking";
import { seedStore } from "./seed";
import { EMPTY_LINKS, type FanWeek, type Store, type Week } from "./types";
import { isoWeekId, previousWeekId, weekRange } from "./week";
import { ARENAS, FAN_POT_SEED_CENTS, migrateArena, splitEntry, type Arena } from "./rules";
import { cappedPot } from "./money";
import { backfillFoundingPassCodes, ensureWeeklyGiveaway } from "./promo";
import { stripDemoPlaceholders as stripFakeAccounts } from "./storeCleanup";

function seedPath() {
  return path.join(process.cwd(), "data", "store.json");
}

function filePath() {
  if (process.env.VERCEL) return path.join("/tmp", "callboard-store.json");
  return seedPath();
}

const BLOB_STORE_PATH = "callboard/store.json";

function blobEnabled() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}

async function readBlobJson(): Promise<string | null> {
  if (!blobEnabled()) return null;
  try {
    const { get } = await import("@vercel/blob");
    const result = await get(BLOB_STORE_PATH, { access: "private" });
    if (!result || result.statusCode !== 200 || !result.stream) return null;
    return await new Response(result.stream).text();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/not found|404|BlobNotFound/i.test(msg)) return null;
    console.error("blob read failed", msg);
    return null;
  }
}

async function writeBlobJson(json: string) {
  if (!blobEnabled()) return;
  const { put } = await import("@vercel/blob");
  await put(BLOB_STORE_PATH, json, {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}


let memory: Store | null = null;
/** Wall time of last successful persist into `memory` (write-ahead for Blob lag). */
let memoryWrittenAt = 0;
let queue: Promise<unknown> = Promise.resolve();

function storeStamp(store: Store) {
  return store.users.length * 1_000_000 + store.entries.length * 1_000 + store.votes.length;
}

/** True when `a` is a fresher write than `b` (write counter first, then legacy size stamp). */
function isAhead(a: Store, b: Store) {
  const ra = a.rev || 0;
  const rb = b.rev || 0;
  if (ra !== rb) return ra > rb;
  return storeStamp(a) > storeStamp(b);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Prefer in-isolate write-ahead memory when Blob is still catching up. */
function preferFresher(fromBlob: Store): Store {
  if (memory && memoryWrittenAt > 0 && isAhead(memory, fromBlob)) {
    return memory;
  }
  memory = fromBlob;
  return fromBlob;
}

function emptyStore(): Store {
  return {
    users: [],
    entries: [],
    votes: [],
    weeks: [],
    payouts: [],
    fanWeeks: [],
    houseCents: 0,
    fanPotSeedCents: FAN_POT_SEED_CENTS,
    chargesLive: true,
    chargesLiveAt: new Date().toISOString(),
    foundingPassCount: 0,
    foundingPasses: [],
    weeklyGiveaway: null,
    passwordResets: [],
  };
}

function ensureWeek(store: Store, arena: Arena, weekId: string) {
  let week = store.weeks.find((w) => w.id === weekId && w.arena === arena);
  if (!week) {
    const { start } = weekRange(weekId);
    week = {
      id: weekId,
      arena,
      status: "open",
      openedAt: start.toISOString(),
      closedAt: null,
      entryCount: 0,
      potCents: 0,
      cutWinnerIds: [],
      heatWinnerId: null,
    };
    store.weeks.push(week);
  }
  return week;
}

function ensureFanWeek(store: Store, weekId: string) {
  if (!store.fanWeeks) store.fanWeeks = [];
  let week = store.fanWeeks.find((w) => w.weekId === weekId);
  if (!week) {
    const { start } = weekRange(weekId);
    week = {
      weekId,
      status: "open",
      openedAt: start.toISOString(),
      closedAt: null,
      potCents: 0,
      winnerIds: [],
    };
    store.fanWeeks.push(week);
  }
  return week;
}

function closeFanWeekIfDue(store: Store, weekId: string) {
  const current = isoWeekId();
  if (weekId === current) return;
  const week = store.fanWeeks.find((w) => w.weekId === weekId);
  if (!week || week.status === "closed") return;
  if (!store.chargesLive) {
    week.potCents = 0;
    week.status = "closed";
    week.closedAt = new Date().toISOString();
    return;
  }
  applyFanPayouts(store, week);
}

function stripDemoPlaceholders(store: Store) {
  return stripFakeAccounts(store);
}

function closeWeekIfDue(store: Store, arena: Arena, weekId: string) {
  const current = isoWeekId();
  if (weekId === current) return;
  const week = store.weeks.find((w) => w.id === weekId && w.arena === arena);
  if (!week || week.status === "closed") return;
  const entries = liveEntries(store, arena, weekId);
  if (!store.chargesLive) {
    week.potCents = 0;
    week.entryCount = entries.length;
    week.status = "closed";
    week.closedAt = new Date().toISOString();
    return;
  }
  week.potCents = cappedPot(entries.reduce((sum, e) => sum + e.potCents, 0));
  const users = new Map(store.users.map((u) => [u.id, u]));
  applyPayouts(store, week, entries, users);
}

let persistAfterMigrate = false;

function migrate(store: Store): Store {
  for (const user of store.users) {
    if (typeof (user as { paypalEmail?: string }).paypalEmail !== "string") {
      (user as { paypalEmail: string }).paypalEmail = "";
      persistAfterMigrate = true;
    }
  }
  if (!store.users) store.users = [];
  if (!store.entries) store.entries = [];
  if (!store.votes) store.votes = [];
  if (!store.weeks) store.weeks = [];
  if (!store.payouts) store.payouts = [];
  if (!store.fanWeeks) store.fanWeeks = [];
  if (!store.houseCents) store.houseCents = 0;
  // Display/accounting seed only — never charges Stripe/Cash App.
  if (typeof store.fanPotSeedCents !== "number" || store.fanPotSeedCents < FAN_POT_SEED_CENTS) {
    store.fanPotSeedCents = FAN_POT_SEED_CENTS;
    persistAfterMigrate = true;
  }
  if (store.foundingPassCount === undefined) store.foundingPassCount = 0;
  if (!store.foundingPasses) store.foundingPasses = [];
  if (store.weeklyGiveaway === undefined) store.weeklyGiveaway = null;
  if (!store.passwordResets) store.passwordResets = [];
  if (!store.fans) store.fans = [];
  if (!store.fanRate) store.fanRate = {};
  if (stripDemoPlaceholders(store)) {
    store.chargesLive = true;
    store.chargesLiveAt = store.chargesLiveAt || new Date().toISOString();
    persistAfterMigrate = true;
  }
  if (store.chargesLive === undefined) {
    store.chargesLive = true;
    persistAfterMigrate = true;
  }
  if (store.chargesLiveAt === undefined) store.chargesLiveAt = store.chargesLive ? new Date().toISOString() : null;
  for (const user of store.users) {
    if (user.freePasses === undefined) user.freePasses = 0;
    if (user.earnedFoundingPass === undefined) user.earnedFoundingPass = false;
    user.links = { ...EMPTY_LINKS, ...(user.links || {}) };
  }
  if (backfillFoundingPassCodes(store)) persistAfterMigrate = true;
  for (const vote of store.votes) {
    if (vote.userId === undefined) vote.userId = null;
  }
  ensureWeeklyGiveaway(store);
  if (store.chargesLive) {
    for (const entry of store.entries) {
      const sid = String(entry.stripeSessionId || "");
      const realPay = sid.startsWith("cs_") || sid === "demo";
      if (!realPay) {
        entry.potCents = 0;
        entry.houseCents = 0;
        entry.feeCents = 0;
      }
    }
  }
  for (const entry of store.entries) {
    entry.arena = migrateArena(entry.arena, entry.screenKind);
    entry.links = { ...EMPTY_LINKS, ...(entry.links || {}) };
    if (entry.fanCents === undefined) entry.fanCents = 0;
    if (entry.houseCents === undefined || entry.feeCents === undefined) {
      const split = splitEntry(entry.arena);
      entry.houseCents = split.houseCents;
      entry.feeCents = split.feeCents;
      if (!entry.potCents) entry.potCents = split.potCents;
    }
  }
  const current = isoWeekId();
  ensureFanWeek(store, current);
  const prev = previousWeekId(current);
  const hadPrevFan = store.entries.some((e) => e.weekId === prev && e.status === "paid");
  if (hadPrevFan) {
    ensureFanWeek(store, prev);
    closeFanWeekIfDue(store, prev);
  }
  for (const arena of ARENAS) {
    ensureWeek(store, arena, current);
    const hadPrev = store.entries.some((e) => e.arena === arena && e.weekId === prev && e.status === "paid");
    if (hadPrev) {
      ensureWeek(store, arena, prev);
      closeWeekIfDue(store, arena, prev);
    }
    const week = store.weeks.find((w) => w.id === current && w.arena === arena)!;
    week.potCents = cappedPot(liveEntries(store, arena, current).reduce((sum, e) => sum + e.potCents, 0));
    week.entryCount = liveEntries(store, arena, current).length;
  }
  const fan = store.fanWeeks.find((w) => w.weekId === current);
  if (fan && fan.status === "open") {
    const fromEntries = store.entries
      .filter((e) => e.weekId === current && e.status === "paid")
      .reduce((s, e) => s + (e.fanCents || 0), 0);
    const seed = store.fanPotSeedCents || 0;
    fan.potCents = cappedPot(fromEntries + seed);
  }
  return store;
}

async function readRawStoreJson(): Promise<string | null> {
  let raw: string | null = await readBlobJson();
  if (raw) return raw;
  try {
    return await fs.readFile(filePath(), "utf8");
  } catch {
    if (process.env.VERCEL) {
      try {
        return await fs.readFile(seedPath(), "utf8");
      } catch {
        return null;
      }
    }
    return null;
  }
}

/** Fresh load from Blob/disk. Never serves a stale in-process snapshot for writes. */
async function loadFromSource(opts?: { allowSeedWrite?: boolean }): Promise<Store> {
  const ahead = memory;
  const aheadAt = memoryWrittenAt;
  const raw = await readRawStoreJson();
  if (raw) {
    const store = migrate(JSON.parse(raw) as Store);
    // Do not clobber a fresher in-isolate write when Blob is still lagging.
    if (ahead && aheadAt > 0 && isAhead(ahead, store)) {
      memory = ahead;
      memoryWrittenAt = aheadAt;
      return ahead;
    }
    memory = store;
    if (persistAfterMigrate) {
      persistAfterMigrate = false;
      await persist(store);
    }
    // Do NOT rewrite Blob on every cold read — that races with concurrent writes
    // and can wipe newer entries from another serverless instance.
    return store;
  }
  if (!opts?.allowSeedWrite) {
    throw new Error("no store");
  }
  memory = migrate(await seedStore(emptyStore()));
  persistAfterMigrate = false;
  await persist(memory);
  return memory!;
}

async function loadFromSourceRetrying(opts?: { allowSeedWrite?: boolean }): Promise<Store> {
  let lastErr: unknown = null;
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const store = await loadFromSource(opts);
      return preferFresher(store);
    } catch (err) {
      lastErr = err;
      // Brief backoff for Blob eventual consistency after a recent write.
      await sleep(120 + attempt * 180);
    }
  }
  if (memory) return memory;
  throw lastErr instanceof Error ? lastErr : new Error("no store");
}

async function load(): Promise<Store> {
  // On Blob-backed deploys, read through to source but keep write-ahead memory so
  // signup → login /me on the same isolate is immediate despite Blob lag.
  if (blobEnabled()) {
    // Hot path: recent local write (same serverless isolate).
    if (memory && Date.now() - memoryWrittenAt < 60_000) {
      migrate(memory);
      return memory;
    }
    return await loadFromSourceRetrying({ allowSeedWrite: false });
  }
  if (memory) {
    migrate(memory);
    if (persistAfterMigrate) {
      persistAfterMigrate = false;
      await persist(memory);
    }
    return memory;
  }
  try {
    return await loadFromSource({ allowSeedWrite: true });
  } catch {
    memory = migrate(await seedStore(emptyStore()));
    persistAfterMigrate = false;
    await persist(memory);
    return memory!;
  }
}

async function persist(store: Store) {
  store.rev = (store.rev || 0) + 1;
  const json = JSON.stringify(store, null, 2);
  memory = store;
  memoryWrittenAt = Date.now();
  await writeBlobJson(json);
  await fs.mkdir(path.dirname(filePath()), { recursive: true });
  const dest = filePath();
  const tmp = `${dest}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, json, "utf8");
  try {
    await fs.copyFile(tmp, dest);
  } finally {
    await fs.unlink(tmp).catch(() => undefined);
  }
}

export async function readStore() {
  return load();
}

export async function updateStore<T>(fn: (store: Store) => T | Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    // Re-read Blob, but keep write-ahead memory if Blob is still lagging so we
    // do not wipe a user that was just signed up on this isolate.
    let store: Store;
    try {
      store = await loadFromSource({ allowSeedWrite: false });
      store = preferFresher(store);
    } catch (err) {
      if (memory) {
        store = memory;
      } else {
        throw err;
      }
    }
    migrate(store);
    const result = await fn(store);
    await persist(store);
    return result;
  });
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function currentFanWeek(store: Store): FanWeek {
  return ensureFanWeek(store, isoWeekId());
}

export function currentWeeks(store: Store): Record<Arena, Week> {
  const id = isoWeekId();
  return {
    blind: ensureWeek(store, "blind", id),
    tracks: ensureWeek(store, "tracks", id),
    film: ensureWeek(store, "film", id),
    video: ensureWeek(store, "video", id),
    creator: ensureWeek(store, "creator", id),
  };
}
