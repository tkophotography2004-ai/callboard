import type { Store } from "./types";

/** Fresh launch store — no demo artists, no fake cuts. */
export async function seedStore(store: Store): Promise<Store> {
  store.users = [];
  store.entries = [];
  store.votes = [];
  store.weeks = [];
  store.payouts = [];
  store.fanWeeks = [];
  store.houseCents = 0;
  store.chargesLive = true;
  store.chargesLiveAt = new Date().toISOString();
  store.foundingPassCount = 0;
  store.weeklyGiveaway = null;
  return store;
}
