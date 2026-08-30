export const APP_NAME = "Callboard";
export const APP_PORT = 3200;
export const TAGLINE = "Names off. Keep or Pass. Cash on Cash App.";

export function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${APP_PORT}`;
}

const GITHUB_SEED =
  "https://raw.githubusercontent.com/tkophotography2004-ai/callboard/main/public";

export function assetUrl(path: string) {
  if (!path) return path;
  if (path.startsWith("http")) return path;
  if (process.env.VERCEL && path.startsWith("/seed/")) return `${GITHUB_SEED}${path}`;
  return path;
}

export function entryUrl(slug: string, origin?: string) {
  return `${origin || siteUrl()}/e/${slug}`;
}

export function boardUrl(arena: "tracks" | "screen", origin?: string) {
  return `${origin || siteUrl()}/board/${arena}`;
}
