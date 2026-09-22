import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { cookiePath } from "./config";
import { readStore } from "./store";
import type { SessionUser, User } from "./types";

export { hashPassword, verifyPassword } from "./password";

const COOKIE = "cb_session";
const ADMIN_COOKIE = "cb_admin";
const MAX_AGE = 60 * 60 * 24 * 30;

export function adminPassword() {
  return process.env.CALLBOARD_ADMIN_PASSWORD || "callboard";
}

function secret() {
  return process.env.CALLBOARD_SECRET || "callboard-dev-secret-change-me";
}

function sign(userId: string) {
  const exp = Date.now() + MAX_AGE * 1000;
  const body = Buffer.from(JSON.stringify({ userId, exp })).toString("base64url");
  const sig = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function unsign(token: string): { userId: string; exp: number } | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", secret()).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as {
      userId: string;
      exp: number;
    };
    if (!payload.userId || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function toSession(user: User): SessionUser {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    cashtag: user.cashtag || "",
    paypalEmail: user.paypalEmail || "",
    freePasses: user.freePasses || 0,
    earnedFoundingPass: Boolean(user.earnedFoundingPass),
  };
}

export async function setSession(userId: string) {
  const jar = await cookies();
  jar.set(COOKIE, sign(userId), {
    httpOnly: true,
    sameSite: "lax",
    path: cookiePath(),
    maxAge: MAX_AGE,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const payload = unsign(token);
  if (!payload) return null;
  const store = await readStore();
  const user = store.users.find((u) => u.id === payload.userId);
  if (!user || user.disabled) return null;
  return toSession(user);
}

export async function setAdminCookie() {
  const jar = await cookies();
  const body = Buffer.from(JSON.stringify({ admin: true, exp: Date.now() + MAX_AGE * 1000 })).toString(
    "base64url",
  );
  const sig = createHmac("sha256", secret()).update(body).digest("base64url");
  jar.set(ADMIN_COOKIE, `${body}.${sig}`, {
    httpOnly: true,
    sameSite: "lax",
    path: cookiePath(),
    maxAge: MAX_AGE,
  });
}

export async function clearAdminCookie() {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
}

export async function isAdmin() {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  const [body, sig] = token.split(".");
  if (!body || !sig) return false;
  const expected = createHmac("sha256", secret()).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as {
      admin?: boolean;
      exp?: number;
    };
    return Boolean(payload.admin && payload.exp && payload.exp > Date.now());
  } catch {
    return false;
  }
}
