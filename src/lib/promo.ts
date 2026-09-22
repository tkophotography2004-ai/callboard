import { createHash } from "crypto";
import { FOUNDING_PASS_LIMIT } from "./rules";
import { isoWeekId } from "./week";
import type { Store, User } from "./types";

export function awardFoundingPass(store: Store, user: User) {
  if (user.earnedFoundingPass) return false;
  if ((store.foundingPassCount || 0) >= FOUNDING_PASS_LIMIT) return false;
  user.earnedFoundingPass = true;
  user.freePasses = (user.freePasses || 0) + 1;
  store.foundingPassCount = (store.foundingPassCount || 0) + 1;
  return true;
}

export function consumeFreePass(user: User) {
  if ((user.freePasses || 0) <= 0) return false;
  user.freePasses -= 1;
  return true;
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
