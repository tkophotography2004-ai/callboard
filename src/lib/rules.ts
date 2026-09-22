export const ARENAS = ["blind", "tracks", "screen"] as const;
export type Arena = (typeof ARENAS)[number];
export type ScreenKind = "series" | "music-video" | "short";

export type PricePlan = {
  entryCents: number;
  houseCents: number;
  maxPerDay: number;
};

/** Blind is the talent test. Floor tracks/videos are the cheaper named boards. */
export const PRICE: Record<Arena, PricePlan> = {
  blind: { entryCents: 2000, houseCents: 1200, maxPerDay: 1 },
  tracks: { entryCents: 500, houseCents: 200, maxPerDay: 3 },
  screen: { entryCents: 500, houseCents: 200, maxPerDay: 3 },
};

export const MAX_VIDEO_SECONDS = 120;
export const MAX_AUDIO_SECONDS = 10 * 60;
export const HOOK_SECONDS = 45;
export const MIN_SCOUT_VOTES = 5;

export const MAX_AUDIO_BYTES = 40 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 180 * 1024 * 1024;
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export const CUT1_SHARE = 0.7;
export const CUT2_SHARE = 0.3;
/** Below this, the whole pot goes to Cut #1. */
export const SMALL_POT_CENTS = 1000;

export const ARENA_LABEL: Record<Arena, string> = {
  blind: "Blind",
  tracks: "Tracks",
  screen: "Videos",
};

export const ARENA_PRICE_LABEL: Record<Arena, string> = {
  blind: "Blind $20",
  tracks: "Track $5",
  screen: "Video $5",
};

export const SCREEN_KIND_LABEL: Record<ScreenKind, string> = {
  series: "Series teaser",
  "music-video": "Music video",
  short: "Short film",
};

export function isArena(value: string): value is Arena {
  return (ARENAS as readonly string[]).includes(value);
}

/** Stripe US card: 2.9% + 30¢, rounded up. */
export function stripeFeeCents(amountCents: number) {
  return Math.ceil(amountCents * 0.029 + 30);
}

export function splitEntry(arena: Arena) {
  const plan = PRICE[arena];
  const feeCents = stripeFeeCents(plan.entryCents);
  const houseCents = plan.houseCents;
  const potCents = Math.max(0, plan.entryCents - houseCents - feeCents);
  return { entryCents: plan.entryCents, houseCents, feeCents, potCents };
}

export function formatUsd(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export function normalizeCashtag(raw: string) {
  const t = raw.trim().replace(/^\$/, "");
  if (!t) return "";
  if (!/^[A-Za-z][A-Za-z0-9_-]{2,19}$/.test(t)) return null;
  return `$${t}`;
}

/** Trim + lowercase; empty stays "". Invalid non-empty returns null. */
export function normalizePaypalEmail(raw: string) {
  const email = raw.trim().toLowerCase();
  if (!email) return "";
  if (!emailOk(email)) return null;
  return email;
}

/** True when the user has a Cash App cashtag and/or PayPal email on file. */
export function hasPayoutMethod(cashtag: string, paypalEmail: string) {
  return Boolean(cashtag || paypalEmail);
}

export function emailOk(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());
}

export function usernameOk(name: string) {
  return /^[a-z0-9_]{3,20}$/.test(name);
}
