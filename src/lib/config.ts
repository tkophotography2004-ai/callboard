export const APP_NAME = "Callboard";
export const APP_PORT = 3200;
export const TAGLINE = "Names off. Keep or Pass. Cash on Cash App.";

export function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || `http://localhost:${APP_PORT}`;
}

export function entryUrl(slug: string, origin?: string) {
  return `${origin || siteUrl()}/e/${slug}`;
}

export function boardUrl(arena: "tracks" | "screen", origin?: string) {
  return `${origin || siteUrl()}/board/${arena}`;
}
