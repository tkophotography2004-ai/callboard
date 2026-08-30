import { splitEntry } from "./rules";
import type { Entry, Store } from "./types";

export function markFoundingEntry(store: Store, entry: Entry) {
  entry.status = "paid";
  entry.paidAt = entry.paidAt || new Date().toISOString();
  entry.stripeSessionId = "founding";
  entry.potCents = 0;
  entry.houseCents = 0;
  entry.feeCents = 0;
}

export function markEntryPaid(store: Store, entry: Entry, stripeSessionId?: string | null) {
  const split = splitEntry(entry.arena);
  const already = entry.status === "paid";
  entry.status = "paid";
  entry.paidAt = entry.paidAt || new Date().toISOString();
  if (stripeSessionId) entry.stripeSessionId = stripeSessionId;
  entry.potCents = split.potCents;
  entry.houseCents = split.houseCents;
  entry.feeCents = split.feeCents;
  if (!already) store.houseCents = (store.houseCents || 0) + split.houseCents;
  return split;
}
