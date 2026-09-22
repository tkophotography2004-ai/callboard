import {
  CUT1_SHARE,
  FAN1_SHARE,
  FAN2_SHARE,
  MIN_FAN_VOTES,
  MIN_SCOUT_VOTES,
  SMALL_POT_CENTS,
  type Arena,
} from "./rules";
import type { Entry, FanWeek, Payout, Store, User, Week } from "./types";

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

export function featuredPlaces(entries: Entry[]): Place[] {
  return boardPlaces(entries).filter((p) => p.qualified).slice(0, 3);
}

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
  usersById: Map<string, { id: string; cashtag: string; paypalEmail?: string }>,
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
      paypalEmail: artist?.paypalEmail || "",
      amountCents: row.amountCents,
      status: "pending",
      sentAt: null,
      note: "",
    };
    store.payouts.push(payout);
    created.push(payout);
  }
  week.cutWinnerIds = featuredPlaces(entries).map((p) => p.entry.id);
  week.heatWinnerId = null;
  week.status = "closed";
  week.closedAt = now.toISOString();
  week.entryCount = entries.length;
  return created;
}

export type FanPlace = {
  rank: number;
  user: User;
  votes: number;
};

export function fanPlaces(store: Store, weekId: string): FanPlace[] {
  const entryIds = new Set(
    store.entries.filter((e) => e.weekId === weekId && e.status === "paid").map((e) => e.id),
  );
  const counts = new Map<string, number>();
  for (const vote of store.votes) {
    if (vote.kind !== "scout" || !vote.userId) continue;
    if (!entryIds.has(vote.entryId)) continue;
    counts.set(vote.userId, (counts.get(vote.userId) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([userId, votes]) => ({ user: store.users.find((u) => u.id === userId), votes }))
    .filter((row): row is { user: User; votes: number } => Boolean(row.user))
    .sort((a, b) => b.votes - a.votes || a.user.displayName.localeCompare(b.user.displayName))
    .map((row, i) => ({ rank: i + 1, user: row.user, votes: row.votes }));
}

export function fanPayoutPlan(places: FanPlace[], potCents: number) {
  const cut = places.filter((p) => p.votes >= MIN_FAN_VOTES);
  const first = cut[0] ?? null;
  const second = cut[1] ?? null;
  const third = cut[2] ?? null;
  if (!first || potCents <= 0) return [];
  if (potCents < SMALL_POT_CENTS || !second) {
    return [{ place: "fan-1" as const, user: first.user, amountCents: potCents }];
  }
  if (!third) {
    const cut1 = Math.round(potCents * 0.7);
    return [
      { place: "fan-1" as const, user: first.user, amountCents: cut1 },
      { place: "fan-2" as const, user: second.user, amountCents: potCents - cut1 },
    ];
  }
  const a = Math.round(potCents * FAN1_SHARE);
  const b = Math.round(potCents * FAN2_SHARE);
  const c = Math.max(0, potCents - a - b);
  return [
    { place: "fan-1" as const, user: first.user, amountCents: a },
    { place: "fan-2" as const, user: second.user, amountCents: b },
    { place: "fan-3" as const, user: third.user, amountCents: c },
  ];
}

export function applyFanPayouts(store: Store, fanWeek: FanWeek, now = new Date()): Payout[] {
  const places = fanPlaces(store, fanWeek.weekId);
  const plan = fanPayoutPlan(places, fanWeek.potCents);
  const created: Payout[] = [];
  for (const row of plan) {
    const payout: Payout = {
      id: `p_${fanWeek.weekId}_${row.place}_${row.user.id}`,
      weekId: fanWeek.weekId,
      arena: "blind",
      place: row.place,
      entryId: "",
      userId: row.user.id,
      cashtag: row.user.cashtag || "",
      paypalEmail: row.user.paypalEmail || "",
      amountCents: row.amountCents,
      status: "pending",
      sentAt: null,
      note: "Fan pot",
    };
    store.payouts.push(payout);
    created.push(payout);
  }
  fanWeek.winnerIds = places.slice(0, 3).map((p) => p.user.id);
  fanWeek.status = "closed";
  fanWeek.closedAt = now.toISOString();
  return created;
}
