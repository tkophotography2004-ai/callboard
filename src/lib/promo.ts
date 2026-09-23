import { createHash, randomBytes } from "crypto";
import { FOUNDING_PASS_LIMIT } from "./rules";
import { isoWeekId } from "./week";
import type { FoundingPass, Store, User } from "./types";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function normalizePassCode(raw: string) {
  const cleaned = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!cleaned) return "";
  if (cleaned.startsWith("SC") && cleaned.length >= 8) return `SC-${cleaned.slice(2, 8)}`;
  if (cleaned.length >= 6) return `SC-${cleaned.slice(-6)}`;
  return cleaned;
}

function mintPassCode(store: Store): string {
  const existing = new Set((store.foundingPasses || []).map((p) => p.code));
  for (let i = 0; i < 40; i++) {
    let body = "";
    const bytes = randomBytes(6);
    for (let j = 0; j < 6; j++) body += CODE_ALPHABET[bytes[j] % CODE_ALPHABET.length];
    const code = `SC-${body}`;
    if (!existing.has(code)) return code;
  }
  throw new Error("Could not mint a unique pass code.");
}

export function awardFoundingPass(store: Store, user: User, entryId?: string | null): string | null {
  if (user.earnedFoundingPass) return null;
  if ((store.foundingPassCount || 0) >= FOUNDING_PASS_LIMIT) return null;
  if (!store.foundingPasses) store.foundingPasses = [];
  user.earnedFoundingPass = true;
  user.freePasses = (user.freePasses || 0) + 1;
  store.foundingPassCount = (store.foundingPassCount || 0) + 1;
  const code = mintPassCode(store);
  const pass: FoundingPass = {
    code,
    userId: user.id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    awardedAt: new Date().toISOString(),
    entryId: entryId || null,
    usedAt: null,
  };
  store.foundingPasses.push(pass);
  return code;
}

/** Consume one account free pass. Marks an unused founding code for this user when present. */
export function consumeFreePass(store: Store, user: User): { ok: boolean; code?: string } {
  if ((user.freePasses || 0) <= 0) return { ok: false };
  user.freePasses -= 1;
  const pass = (store.foundingPasses || []).find((p) => p.userId === user.id && !p.usedAt);
  if (pass) {
    pass.usedAt = new Date().toISOString();
    return { ok: true, code: pass.code };
  }
  return { ok: true };
}

/** Redeem a founding pass code belonging to this user. */
export function redeemPassCode(
  store: Store,
  user: User,
  raw: string,
): { ok: boolean; code?: string; error?: string } {
  const code = normalizePassCode(raw);
  if (!/^SC-[A-Z0-9]{6}$/.test(code)) {
    return { ok: false, error: "Enter a valid free-pass code like SC-XXXXXX." };
  }
  if (!store.foundingPasses) store.foundingPasses = [];
  const pass = store.foundingPasses.find((p) => p.code === code);
  if (!pass) return { ok: false, error: "That free-pass code was not found." };
  if (pass.usedAt) return { ok: false, error: "That free-pass code was already used." };
  if (pass.userId !== user.id) {
    return { ok: false, error: "That free-pass code belongs to another account." };
  }
  pass.usedAt = new Date().toISOString();
  if ((user.freePasses || 0) > 0) user.freePasses -= 1;
  return { ok: true, code: pass.code };
}

export function unusedPassCodesForUser(store: Store, userId: string): string[] {
  return (store.foundingPasses || [])
    .filter((p) => p.userId === userId && !p.usedAt)
    .map((p) => p.code);
}

/** Backfill SC- codes for artists who already earned a founding pass without one. */
export function backfillFoundingPassCodes(store: Store): boolean {
  if (!store.foundingPasses) store.foundingPasses = [];
  let changed = false;
  const byUser = new Map<string, FoundingPass[]>();
  for (const pass of store.foundingPasses) {
    const list = byUser.get(pass.userId) || [];
    list.push(pass);
    byUser.set(pass.userId, list);
  }
  for (const user of store.users) {
    if (!user.earnedFoundingPass) continue;
    const existing = byUser.get(user.id) || [];
    if (existing.length > 0) continue;
    const unused = Math.max(0, user.freePasses || 0);
    // One founding award per user historically; create a single code.
    const code = mintPassCode(store);
    const pass: FoundingPass = {
      code,
      userId: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      awardedAt: user.createdAt || new Date().toISOString(),
      entryId: null,
      usedAt: unused > 0 ? null : new Date().toISOString(),
    };
    store.foundingPasses.push(pass);
    byUser.set(user.id, [pass]);
    changed = true;
  }
  // Keep count aligned with claimed slots (unique founding earners), capped at limit.
  const claimed = store.users.filter((u) => u.earnedFoundingPass).length;
  const nextCount = Math.min(FOUNDING_PASS_LIMIT, Math.max(store.foundingPassCount || 0, claimed));
  if (store.foundingPassCount !== nextCount) {
    store.foundingPassCount = nextCount;
    changed = true;
  }
  return changed;
}

export function ensureWeeklyGiveaway(store: Store) {
  const weekId = isoWeekId();
  if (store.weeklyGiveaway?.weekId === weekId) return store.weeklyGiveaway;
  const submitted = new Set(store.entries.filter((e) => e.status === "paid").map((e) => e.userId));
  const candidates = store.users.filter((u) => submitted.has(u.id));
  if (!candidates.length) {
    store.weeklyGiveaway = { weekId, userId: null, username: "", displayName: "" };
    return store.weeklyGiveaway;
  }
  const hash = createHash("sha256").update(`scroll-call-giveaway:${weekId}`).digest();
  const idx = hash.readUInt32BE(0) % candidates.length;
  const pick = candidates[idx];
  pick.freePasses = (pick.freePasses || 0) + 1;
  store.weeklyGiveaway = {
    weekId,
    userId: pick.id,
    username: pick.username,
    displayName: pick.displayName,
  };
  return store.weeklyGiveaway;
}
