import { getSessionUser } from "./auth";
import type { SessionUser } from "./types";

export function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export async function requireUser(): Promise<SessionUser | Response> {
  const user = await getSessionUser();
  if (!user) return json({ error: "Sign in required." }, 401);
  return user;
}

export function isResponse(value: SessionUser | Response): value is Response {
  return value instanceof Response;
}

export function clientIp(req: Request) {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "local";
}
