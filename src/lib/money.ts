import { awardFoundingPass } from "./promo";
import { potCapCents, splitEntry } from "./rules";
import type { Entry, Store } from "./types";

export function roomInPot(weekPotCents: number) {
  return Math.max(0, potCapCents() - Math.max(0, weekPotCents));
}

export function cappedPot(cents: number) {
  return Math.min(Math.max(0, cents), potCapCents());
}

export function markFoundingEntry(store: Store, entry: Entry) {
  entry.status = "paid";
  entry.paidAt = entry.paidAt || new Date().toISOString();
  entry.stripeSessionId = "founding";
  entry.potCents = 0;
  entry.houseCents = 0;
  entry.feeCents = 0;
  entry.fanCents = 0;
  const owner = store.users.find((u) => u.id === entry.userId);
  if (owner) awardFoundingPass(store, owner);
}

export function markEntryPaid(store: Store, entry: Entry, stripeSessionId?: string | null) {
  const split = splitEntry(entry.arena);
  const already = entry.status === "paid";
  const week = store.weeks.find((w) => w.id === entry.weekId && w.arena === entry.arena) || null;
  const fanWeek = (store.fanWeeks || []).find((w) => w.weekId === entry.weekId) || null;
  entry.status = "paid";
  entry.paidAt = entry.paidAt || new Date().toISOString();
  if (stripeSessionId) entry.stripeSessionId = stripeSessionId;
  const current = week?.potCents || 0;
  const toPot = already ? entry.potCents : Math.min(split.potCents, roomInPot(current));
  const overflow = already ? 0 : split.potCents - toPot;
  const fanCurrent = fanWeek?.potCents || 0;
  const toFan = already ? entry.fanCents || 0 : Math.min(split.fanCents, roomInPot(fanCurrent));
  const fanOverflow = already ? 0 : split.fanCents - toFan;
  entry.potCents = toPot;
  entry.fanCents = toFan;
  entry.houseCents = split.houseCents + overflow + fanOverflow;
  entry.feeCents = split.feeCents;
  if (!already) {
    store.houseCents = (store.houseCents || 0) + split.houseCents + overflow + fanOverflow;
    if (week) week.potCents = cappedPot((week.potCents || 0) + toPot);
    if (fanWeek) fanWeek.potCents = cappedPot((fanWeek.potCents || 0) + toFan);
    const owner = store.users.find((u) => u.id === entry.userId);
    if (owner) awardFoundingPass(store, owner);
  }
  return split;
}
