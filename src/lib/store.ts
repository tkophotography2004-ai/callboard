import { promises as fs } from "fs";
import path from "path";
import { applyPayouts, liveEntries } from "./ranking";
import { seedStore } from "./seed";
import type { Store, Week } from "./types";
import { isoWeekId, previousWeekId, weekRange } from "./week";
import { ARENAS, splitEntry, type Arena } from "./rules";

function filePath() {
  return path.join(process.cwd(), "data", "store.json");
}

let memory: Store | null = null;
let queue: Promise<unknown> = Promise.resolve();

function emptyStore(): Store {
  return {
    users: [],
    entries: [],
    votes: [],
    weeks: [],
    payouts: [],
    houseCents: 0,
    chargesLive: false,
    chargesLiveAt: null,
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
  week.potCents = entries.reduce((sum, e) => sum + e.potCents, 0);
  const users = new Map(store.users.map((u) => [u.id, u]));
  applyPayouts(store, week, entries, users);
}

function migrate(store: Store): Store {
  if (!store.users) store.users = [];
  if (!store.entries) store.entries = [];
  if (!store.votes) store.votes = [];
  if (!store.weeks) store.weeks = [];
  if (!store.payouts) store.payouts = [];
  if (!store.houseCents) store.houseCents = 0;
  if (store.chargesLive === undefined) store.chargesLive = false;
  if (store.chargesLiveAt === undefined) store.chargesLiveAt = null;
  for (const entry of store.entries) {
    if (entry.arena !== "blind" && entry.arena !== "tracks" && entry.arena !== "screen") {
      entry.arena = "tracks";
    }
    if (entry.houseCents === undefined || entry.feeCents === undefined) {
      const split = splitEntry(entry.arena);
      entry.houseCents = split.houseCents;
      entry.feeCents = split.feeCents;
      if (!entry.potCents) entry.potCents = split.potCents;
    }
  }
  const current = isoWeekId();
  for (const arena of ARENAS) {
    ensureWeek(store, arena, current);
    const prev = previousWeekId(current);
    const hadPrev = store.entries.some((e) => e.arena === arena && e.weekId === prev && e.status === "paid");
    if (hadPrev) {
      ensureWeek(store, arena, prev);
      closeWeekIfDue(store, arena, prev);
    }
    const week = store.weeks.find((w) => w.id === current && w.arena === arena)!;
    week.potCents = liveEntries(store, arena, current).reduce((sum, e) => sum + e.potCents, 0);
    week.entryCount = liveEntries(store, arena, current).length;
  }
  return store;
}

async function load(): Promise<Store> {
  if (memory) return memory;
  try {
    const raw = await fs.readFile(filePath(), "utf8");
    memory = migrate(JSON.parse(raw) as Store);
  } catch {
    memory = migrate(await seedStore(emptyStore()));
    await persist(memory);
  }
  return memory;
}

async function persist(store: Store) {
  await fs.mkdir(path.dirname(filePath()), { recursive: true });
  const tmp = `${filePath()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(store, null, 2), "utf8");
  await fs.rename(tmp, filePath());
}

export async function readStore() {
  return load();
}

export async function updateStore<T>(fn: (store: Store) => T | Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const store = await load();
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

export function currentWeeks(store: Store): Record<Arena, Week> {
  const id = isoWeekId();
  return {
    blind: ensureWeek(store, "blind", id),
    tracks: ensureWeek(store, "tracks", id),
    screen: ensureWeek(store, "screen", id),
  };
}
