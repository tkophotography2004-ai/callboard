export const ARENAS = ["blind", "tracks", "film", "video", "creator"] as const;
export type Arena = (typeof ARENAS)[number];
export type ScreenKind = "series" | "music-video" | "short";

export type PricePlan = {
  entryCents: number;
  houseCents: number;
  fanCents: number;
  maxPerDay: number;
};

/** Blind is the talent test. Floor tracks/videos are the cheaper named boards. */
export const PRICE: Record<Arena, PricePlan> = {
  blind: { entryCents: 3000, houseCents: 1200, fanCents: 300, maxPerDay: 1 },
  tracks: { entryCents: 500, houseCents: 200, fanCents: 30, maxPerDay: 3 },
  film: { entryCents: 500, houseCents: 200, fanCents: 30, maxPerDay: 3 },
  video: { entryCents: 500, houseCents: 200, fanCents: 30, maxPerDay: 3 },
  creator: { entryCents: 500, houseCents: 200, fanCents: 30, maxPerDay: 3 },
};

export const MAX_VIDEO_SECONDS = 120;
export const MAX_AUDIO_SECONDS = 10 * 60;
export const HOOK_SECONDS = 45;
export const MIN_SCOUT_VOTES = 5;
export const MIN_FAN_VOTES = 5;
export const FAN1_SHARE = 0.5;
export const FAN2_SHARE = 0.3;
export const FAN3_SHARE = 0.2;

export const MAX_AUDIO_BYTES = 15 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 40 * 1024 * 1024;
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export const CUT1_SHARE = 0.7;
export const CUT2_SHARE = 0.3;
/** Below this, the whole pot goes to Cut #1. */
export const SMALL_POT_CENTS = 1000;
/** Temporary weekly cap while the board is young. */
export const POT_CAP_TEMP_CENTS = 10_000;
/** Full weekly cap after the lift date. */
export const POT_CAP_FULL_CENTS = 50_000;
/** $100 until this instant, then $500. 2026-10-16 00:00 America/Chicago. */
export const POT_CAP_LIFTS_AT_MS = Date.parse("2026-10-16T05:00:00.000Z");

export function potCapCents(at = Date.now()) {
  return at >= POT_CAP_LIFTS_AT_MS ? POT_CAP_FULL_CENTS : POT_CAP_TEMP_CENTS;
}

/** @deprecated Use potCapCents() — kept for older imports. */
export const POT_CAP_CENTS = POT_CAP_TEMP_CENTS;
/** Cash App payouts after the house crowns winners. */
export const PAYOUT_DAYS = 10;

export const ARENA_LABEL: Record<Arena, string> = {
  blind: "Blind Lounge",
  tracks: "Track Lounge",
  film: "Film Lounge",
  video: "Music Video Lounge",
  creator: "Creator Lounge",
};

/** When true, the public cannot sign in, sign up, or enter. */
export const PUBLIC_CLOSED = false;

/** Named lounges free until this instant (48h open-house). Blind stays $30. */
export const NAMED_FREE_UNTIL_MS = Date.parse("2026-09-24T16:00:00.000Z"); // Thu Sep 24, 11:00 AM America/Chicago

/** True while Track / Film / Music Video / Creator entries are free. Blind stays paid. */
export function namedLoungesAreFree(at = Date.now()) {
  return at < NAMED_FREE_UNTIL_MS;
}

/** @deprecated Prefer namedLoungesAreFree() — value frozen at module load. */
export const NAMED_LOUNGES_FREE = namedLoungesAreFree();
/** Launch price for named lounges. */
export const NAMED_LAUNCH_CENTS = 500;
/** Regular named-lounge price after the launch window. */
export const NAMED_REGULAR_CENTS = 1000;
/** $5 launch through this instant, then $10. 2026-10-01 00:00 America/Chicago. */
export const NAMED_PROMO_ENDS_MS = Date.parse("2026-10-01T05:00:00.000Z");

export function isNamedLounge(arena: Arena) {
  return arena !== "blind";
}

export function namedLaunchActive(at = Date.now()) {
  return !namedLoungesAreFree(at) && at < NAMED_PROMO_ENDS_MS;
}

export function namedLoungePriceCents(at = Date.now()) {
  if (namedLoungesAreFree(at)) return 0;
  return at >= NAMED_PROMO_ENDS_MS ? NAMED_REGULAR_CENTS : NAMED_LAUNCH_CENTS;
}

export function namedPriceShort(at = Date.now()) {
  if (namedLoungesAreFree(at)) return "free";
  return namedLaunchActive(at) ? "$5" : "$10";
}

export function namedPriceLine(at = Date.now()) {
  if (namedLoungesAreFree(at)) return "free";
  if (namedLaunchActive(at)) return "$5 launch · regular $10";
  return "$10 a submission";
}

export function namedPriceSentence(at = Date.now()) {
  if (namedLoungesAreFree(at)) return "free";
  if (namedLaunchActive(at)) return "$5 for launch (regular price is $10 a submission)";
  return "$10 a submission";
}

export function loungeRequiresPayment(arena: Arena, chargesLive: boolean) {
  if (!chargesLive) return false;
  if (namedLoungesAreFree() && isNamedLounge(arena)) return false;
  const cents = isNamedLounge(arena) ? namedLoungePriceCents() : PRICE[arena].entryCents;
  return cents > 0;
}

export function arenaPriceLabel(arena: Arena) {
  if (arena === "blind") return "Blind $30";
  const names: Record<Exclude<Arena, "blind">, string> = {
    tracks: "Track",
    film: "Film",
    video: "Music Video",
    creator: "Creator",
  };
  if (namedLoungesAreFree()) return `${names[arena]} free`;
  if (namedLaunchActive()) return `${names[arena]} $5 launch`;
  return `${names[arena]} $10`;
}

export const ARENA_PRICE_LABEL: Record<Arena, string> = {
  blind: arenaPriceLabel("blind"),
  tracks: arenaPriceLabel("tracks"),
  film: arenaPriceLabel("film"),
  video: arenaPriceLabel("video"),
  creator: arenaPriceLabel("creator"),
};

export const SCREEN_KIND_LABEL: Record<ScreenKind, string> = {
  series: "Series teaser",
  "music-video": "Music video",
  short: "Short film",
};

export function isArena(value: string): value is Arena {
  return (ARENAS as readonly string[]).includes(value);
}

export function isAudioLounge(arena: Arena) {
  return arena === "blind" || arena === "tracks";
}

export function isLinkLounge(arena: Arena) {
  return arena === "creator" || arena === "film" || arena === "video";
}

export const FOUNDING_PASS_LIMIT = 20;

export const NOTHING_LIKE_THIS =
  "There is nothing like this. If there were, they would charge way more.";

export const FOUNDING_PASS_LINE =
  "The first 20 artists to add their work get a free submission to use later.";

export const WEEKLY_GIVEAWAY_LINE =
  "Every week, one random artist on the board gets a free submission.";

export function loungeAtCap(potCents: number) {
  return potCents >= potCapCents();
}

export function migrateArena(raw: string, screenKind?: string | null): Arena {
  if (isArena(raw)) return raw;
  if (raw === "screen") return screenKind === "music-video" ? "video" : "film";
  return "tracks";
}

/** Stripe US card: 2.9% + 30¢, rounded up. */
export function stripeFeeCents(amountCents: number) {
  return Math.ceil(amountCents * 0.029 + 30);
}

export function splitEntry(arena: Arena) {
  const plan = PRICE[arena];
  const entryCents = isNamedLounge(arena) ? namedLoungePriceCents() : plan.entryCents;
  const houseCents =
    isNamedLounge(arena) && entryCents === NAMED_REGULAR_CENTS ? 400 : plan.houseCents;
  const fanCents = isNamedLounge(arena) && entryCents === NAMED_REGULAR_CENTS ? 60 : plan.fanCents;
  const feeCents = stripeFeeCents(entryCents);
  const potCents = Math.max(0, entryCents - houseCents - feeCents - fanCents);
  return { entryCents, houseCents, feeCents, fanCents, potCents };
}

export function formatUsd(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export const PAYDAY_LINE =
  "The week closes Sunday. Winners are crowned then. Cash App payouts are sent within 10 days of the crown.";

export function potCapLine(at = Date.now()) {
  if (potCapCents(at) >= POT_CAP_FULL_CENTS) {
    return `The pot is capped at ${formatUsd(POT_CAP_FULL_CENTS)}.`;
  }
  return `The pot is capped at ${formatUsd(POT_CAP_TEMP_CENTS)} until October 16, then ${formatUsd(POT_CAP_FULL_CENTS)}.`;
}

export const POT_CAP_LINE = potCapLine();

export const LINK_ONLY_LINE =
  "Paste a link. Blind: YouTube, SoundCloud, Spotify, Audiomack, or TikTok. Track: those plus Instagram. Film, music videos, and Creator: YouTube, TikTok, Instagram, or Vimeo.";

export const FILE_LIMIT_LINE = LINK_ONLY_LINE;

export const LIMITS_LINE =
  "Blind is one music track per 24 hours. Track, Film, Music Video, and Creator lounges are three submissions per 24 hours.";

export const FAN_POT_LINE =
  "Fans who Keep or Pass earn a shot at the fan pot. Come back every week. Top fans get Cash App payouts and a featured spot with their socials.";

export const BRIUNKA_IP_LINE =
  "Interested in taking control of your IPs and making money from it? Reach out to Briunka for details.";

export const BRIUNKA_EMAIL = "acrossthestars2026@gmail.com";

export function normalizeCashtag(raw: string) {
  const t = raw.trim().replace(/^\$/, "");
  if (!t) return "";
  if (!/^[A-Za-z][A-Za-z0-9_-]{2,19}$/.test(t)) return null;
  return `$${t}`;
}

export function emailOk(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());
}

export function usernameOk(name: string) {
  return /^[a-z0-9_]{3,20}$/.test(name);
}

export function normalizePaypalEmail(raw: string) {
  const t = raw.trim().toLowerCase();
  if (!t) return "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return null;
  return t;
}
