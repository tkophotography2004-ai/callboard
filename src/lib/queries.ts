import { assetUrl } from "./config";
import { MIN_SCOUT_VOTES, PRICE, type Arena } from "./rules";
import { boardPlaces, cutScore, keepRate, liveEntries, scoutTotal } from "./ranking";
import { currentWeeks, readStore } from "./store";
import type { Entry, Store } from "./types";
import { formatCountdown, isoWeekId, msUntilWeekEnd, weekLabel } from "./week";

export type PublicEntry = {
  id: string;
  slug: string;
  title: string;
  genre: string;
  logline: string;
  arena: Arena;
  screenKind: Entry["screenKind"];
  coverPath: string;
  mediaPath: string | null;
  durationSeconds: number;
  hookStartSeconds: number;
  artist: string;
  username: string;
  hiddenArtist: boolean;
  scoutKeeps: number;
  scoutPasses: number;
  heatVotes: number;
  keepPct: number;
  cut: number;
  sample: number;
  qualified: boolean;
  playCount: number;
};

export function toPublic(store: Store, entry: Entry): PublicEntry {
  const user = store.users.find((u) => u.id === entry.userId);
  const sample = scoutTotal(entry);
  const week = store.weeks.find((w) => w.id === entry.weekId && w.arena === entry.arena);
  const hiddenArtist = entry.arena === "blind" && week?.status !== "closed";
  return {
    id: entry.id,
    slug: entry.slug,
    title: entry.title,
    genre: entry.genre,
    logline: hiddenArtist ? "Name locked until the week closes. Judge the record, not the account." : entry.logline,
    arena: entry.arena,
    screenKind: entry.screenKind,
    coverPath: assetUrl(entry.coverPath),
    mediaPath: entry.mediaPath ? assetUrl(entry.mediaPath) : null,
    durationSeconds: entry.durationSeconds,
    hookStartSeconds: entry.hookStartSeconds,
    artist: hiddenArtist ? "Hidden artist" : user?.displayName || "Unknown",
    username: hiddenArtist ? "hidden" : user?.username || "unknown",
    hiddenArtist,
    scoutKeeps: entry.scoutKeeps,
    scoutPasses: entry.scoutPasses,
    heatVotes: entry.heatVotes,
    keepPct: keepRate(entry),
    cut: cutScore(entry),
    sample,
    qualified: sample >= MIN_SCOUT_VOTES,
    playCount: entry.playCount,
  };
}

export function entriesInWindow(store: Store, userId: string, arena: Arena, now = Date.now()) {
  const since = now - 24 * 3600 * 1000;
  const floor = arena !== "blind";
  return store.entries.filter((e) => {
    if (e.userId !== userId || e.status === "removed") return false;
    if (Date.parse(e.createdAt) < since) return false;
    if (floor) return e.arena === "tracks" || e.arena === "screen";
    return e.arena === "blind";
  }).length;
}

export function remainingToday(store: Store, userId: string, arena: Arena) {
  const used = entriesInWindow(store, userId, arena);
  const cap = PRICE[arena].maxPerDay;
  return Math.max(0, cap - used);
}

export async function homeData() {
  const store = await readStore();
  const weeks = currentWeeks(store);
  const weekId = isoWeekId();
  const boardFor = (arena: Arena) => {
    const live = liveEntries(store, arena, weekId);
    const rawPot = weeks[arena].potCents || live.reduce((s, e) => s + e.potCents, 0);
    return {
      potCents: store.chargesLive ? rawPot : 0,
      houseCents: store.chargesLive ? live.reduce((s, e) => s + (e.houseCents || 0), 0) : 0,
      count: live.length,
      board: boardPlaces(live)
        .slice(0, 5)
        .map((p) => ({ ...p, public: toPublic(store, p.entry) })),
    };
  };
  return {
    weekId,
    weekLabel: weekLabel(weekId),
    countdown: formatCountdown(msUntilWeekEnd(weekId)),
    blind: boardFor("blind"),
    tracks: boardFor("tracks"),
    screen: boardFor("screen"),
    houseCents: store.chargesLive ? store.houseCents || 0 : 0,
    chargesLive: Boolean(store.chargesLive),
  };
}
