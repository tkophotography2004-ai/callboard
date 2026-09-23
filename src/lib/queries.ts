import { assetUrl } from "./config";
import { homeMusicPlayable, type HomeMusicKind } from "./embed";
import { cappedPot } from "./money";
import { EMPTY_LINKS, type ArtistLinks } from "./types";
import { ARENAS, FOUNDING_PASS_LIMIT, MIN_SCOUT_VOTES, PRICE, type Arena } from "./rules";
import { boardPlaces, cutScore, fanPlaces, featuredPlaces, keepRate, liveEntries, scoutTotal } from "./ranking";
import { currentFanWeek, currentWeeks, readStore } from "./store";
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
  links: ArtistLinks | null;
};

export function entryIsCrowned(store: Store, entry: Entry) {
  const week = store.weeks.find((w) => w.id === entry.weekId && w.arena === entry.arena);
  if (!week || week.status !== "closed") return false;
  if (week.cutWinnerIds?.includes(entry.id)) return true;
  return featuredPlaces(liveEntries(store, entry.arena, entry.weekId)).some((p) => p.entry.id === entry.id);
}

export function toPublic(store: Store, entry: Entry): PublicEntry {
  const user = store.users.find((u) => u.id === entry.userId);
  const sample = scoutTotal(entry);
  const week = store.weeks.find((w) => w.id === entry.weekId && w.arena === entry.arena);
  const hiddenArtist = entry.arena === "blind" && week?.status !== "closed";
  const crowned = entryIsCrowned(store, entry);
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
    links: crowned ? entry.links || { ...EMPTY_LINKS } : null,
  };
}

export function entriesInWindow(store: Store, userId: string, arena: Arena, now = Date.now()) {
  const since = now - 24 * 3600 * 1000;
  return store.entries.filter((e) => {
    if (e.userId !== userId || e.status !== "paid") return false;
    if (Date.parse(e.createdAt) < since) return false;
    return e.arena === arena;
  }).length;
}

export function remainingToday(store: Store, userId: string, arena: Arena) {
  const used = entriesInWindow(store, userId, arena);
  const cap = PRICE[arena].maxPerDay;
  return Math.max(0, cap - used);
}


export type HomeMusicQueueItem = {
  id: string;
  slug: string;
  title: string;
  artist: string;
  coverPath: string;
  mediaPath: string;
  durationSeconds: number;
  kind: HomeMusicKind;
};

/** Current-week Music lounge entries that can embed/play in the home player. */
export function buildMusicQueue(store: Store, weekId: string): HomeMusicQueueItem[] {
  const live = liveEntries(store, "tracks", weekId);
  const items: HomeMusicQueueItem[] = [];
  for (const place of boardPlaces(live)) {
    const entry = place.entry;
    const playable = homeMusicPlayable(entry.mediaPath);
    if (!playable || !entry.mediaPath) continue;
    const pub = toPublic(store, entry);
    items.push({
      id: entry.id,
      slug: entry.slug,
      title: entry.title,
      artist: pub.artist,
      coverPath: pub.coverPath,
      mediaPath: pub.mediaPath || entry.mediaPath,
      durationSeconds: entry.durationSeconds,
      kind: playable.kind,
    });
  }
  return items;
}

export async function homeData() {
  const store = await readStore();
  const weeks = currentWeeks(store);
  const weekId = isoWeekId();
  const boardFor = (arena: Arena) => {
    const live = liveEntries(store, arena, weekId);
    const rawPot = weeks[arena]?.potCents || live.reduce((s, e) => s + e.potCents, 0);
    const potCents = store.chargesLive ? cappedPot(rawPot) : 0;
    return {
      potCents,
      houseCents: store.chargesLive ? live.reduce((s, e) => s + (e.houseCents || 0), 0) : 0,
      count: live.length,
      board: boardPlaces(live)
        .slice(0, 5)
        .map((p) => ({ ...p, public: toPublic(store, p.entry) })),
    };
  };
  const lounges = Object.fromEntries(ARENAS.map((arena) => [arena, boardFor(arena)])) as Record<
    Arena,
    ReturnType<typeof boardFor>
  >;
  const fanWeek = currentFanWeek(store);
  const toFan = (row: ReturnType<typeof fanPlaces>[number]) => ({
    rank: row.rank,
    displayName: row.user.displayName,
    username: row.user.username,
    votes: row.votes,
    links: row.user.links || { ...EMPTY_LINKS },
  });
  const lastFan = [...(store.fanWeeks || [])]
    .filter((w) => w.status === "closed")
    .sort((a, b) => Date.parse(b.closedAt || b.openedAt) - Date.parse(a.closedAt || a.openedAt))[0];
  const featuredFans = lastFan
    ? fanPlaces(store, lastFan.weekId)
        .slice(0, 3)
        .map(toFan)
    : [];
  return {
    weekId,
    weekLabel: weekLabel(weekId),
    countdown: formatCountdown(msUntilWeekEnd(weekId)),
    ...lounges,
    houseCents: store.chargesLive ? store.houseCents || 0 : 0,
    chargesLive: Boolean(store.chargesLive),
    foundingPassCount: store.foundingPassCount || 0,
    foundingPassLimit: FOUNDING_PASS_LIMIT,
    weeklyGiveaway: store.weeklyGiveaway,
    fanPotCents: store.chargesLive ? cappedPot(fanWeek.potCents || 0) : 0,
    fanLeaders: fanPlaces(store, weekId).slice(0, 3).map(toFan),
    featuredFans,
    featuredFanWeekId: lastFan?.weekId || null,
    musicQueue: buildMusicQueue(store, weekId),
  };
}

export type PublicFan = {
  rank: number;
  displayName: string;
  username: string;
  votes: number;
  links: ArtistLinks;
};
