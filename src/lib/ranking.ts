import { CUT1_SHARE, MIN_SCOUT_VOTES, SMALL_POT_CENTS, type Arena } from "./rules";
import type { Entry, Payout, Store, Week } from "./types";

export function scoutTotal(entry: Entry) {
  return entry.scoutKeeps + entry.scoutPasses;
}

export function keepRate(entry: Entry) {
  const n = scoutTotal(entry);
  if (!n) return 0;
  return entry.scoutKeeps / n;
}

/** Wilson lower bound so 3/3 does not beat 40/50. This is The Cut. */
export function cutScore(entry: Entry, z = 1.96) {
  const n = scoutTotal(entry);
  if (n < MIN_SCOUT_VOTES) return 0;
  const p = entry.scoutKeeps / n;
  const z2 = z * z;
  const denom = 1 + z2 / n;
  const center = p + z2 / (2 * n);
  const margin = z * Math.sqrt((p * (1 - p) + z2 / (4 * n)) / n);
  return (center - margin) / denom;
}

export function ranked(entries: Entry[]) {
  return [...entries].sort((a, b) => {
    const rankedA = scoutTotal(a) >= MIN_SCOUT_VOTES ? 1 : 0;
    const rankedB = scoutTotal(b) >= MIN_SCOUT_VOTES ? 1 : 0;
    if (rankedA !== rankedB) return rankedB - rankedA;
    const cut = cutScore(b) - cutScore(a);
    if (Math.abs(cut) > 1e-9) return cut;
    const sample = scoutTotal(b) - scoutTotal(a);
    if (sample) return sample;
    return Date.parse(a.createdAt) - Date.parse(b.createdAt);
  });
}

export function heatRanked(entries: Entry[]) {
  return [...entries].sort((a, b) => {
    if (b.heatVotes !== a.heatVotes) return b.heatVotes - a.heatVotes;
    return cutScore(b) - cutScore(a);
  });
}

export function liveEntries(store: Store, arena: Arena, weekId: string) {
  return store.entries.filter(
    (e) => e.arena === arena && e.weekId === weekId && e.status === "paid" && e.mediaPath,
  );
}

export type Place = {
  rank: number;
  entry: Entry;
  cut: number;
  keepPct: number;
  sample: number;
  qualified: boolean;
};

export function boardPlaces(entries: Entry[]): Place[] {
  return ranked(entries).map((entry, i) => ({
    rank: i + 1,
    entry,
    cut: cutScore(entry),
    keepPct: keepRate(entry),
    sample: scoutTotal(entry),
    qualified: scoutTotal(entry) >= MIN_SCOUT_VOTES,
  }));
}

export function payoutPlan(entries: Entry[], potCents: number) {
  const cut = ranked(entries).filter((e) => scoutTotal(e) >= MIN_SCOUT_VOTES);
  const first: Entry | null = cut[0] ?? null;
  const second: Entry | null = cut[1] ?? null;

  if (!first || potCents <= 0) return [];

  if (potCents < SMALL_POT_CENTS || !second) {
    return [{ place: "cut-1" as const, entry: first, amountCents: potCents }];
  }

  const cut1 = Math.round(potCents * CUT1_SHARE);
  const cut2 = potCents - cut1;
  return [
    { place: "cut-1" as const, entry: first, amountCents: cut1 },
    { place: "cut-2" as const, entry: second, amountCents: cut2 },
  ];
}

export function applyPayouts(
  store: Store,
  week: Week,
  entries: Entry[],
  usersById: Map<string, { id: string; cashtag: string }>,
  now = new Date(),
): Payout[] {
  const plan = payoutPlan(entries, week.potCents);
  const created: Payout[] = [];
  for (const row of plan) {
    const artist = usersById.get(row.entry.userId);
    const payout: Payout = {
      id: `p_${week.id}_${row.place}_${row.entry.id}`,
      weekId: week.id,
      arena: week.arena,
      place: row.place,
      entryId: row.entry.id,
      userId: row.entry.userId,
      cashtag: artist?.cashtag || "",
      amountCents: row.amountCents,
      status: "pending",
      sentAt: null,
      note: "",
    };
    store.payouts.push(payout);
    created.push(payout);
  }
  week.cutWinnerIds = plan.map((p) => p.entry.id);
  week.heatWinnerId = null;
  week.status = "closed";
  week.closedAt = now.toISOString();
  week.entryCount = entries.length;
  return created;
}
