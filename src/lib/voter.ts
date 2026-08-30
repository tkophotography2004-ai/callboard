import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";

const COOKIE = "cb_vid";
const MAX_AGE = 60 * 60 * 24 * 400;

export function hashIp(ip: string) {
  return createHash("sha256").update(`cb:${ip}`).digest("hex").slice(0, 24);
}

export async function getOrCreateVoterId() {
  const jar = await cookies();
  const existing = jar.get(COOKIE)?.value;
  if (existing && /^[a-zA-Z0-9_-]{8,40}$/.test(existing)) return existing;
  const id = randomBytes(12).toString("base64url");
  jar.set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
  return id;
}
