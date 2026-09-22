import type { Arena } from "./rules";

export const APP_NAME = "Scroll Call";
export const APP_NAME_MARK = "Scroll Call®";
export const APP_CREDIT = "by Briunka Light®";
export const APP_PORT = 3200;
export const TAGLINE = "Names off. Keep or Pass. Cash on Cash App.";
export const COPYRIGHT_LINE =
  "© 2026 Briunka Light®. Scroll Call® is a registered trademark of Briunka Light®. All rights reserved.";

export function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${APP_PORT}`;
}

export function cookiePath() {
  return process.env.NEXT_PUBLIC_BASE_PATH || "/";
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

export function boardUrl(arena: Arena, origin?: string) {
  return `${origin || siteUrl()}/board/${arena}`;
}
