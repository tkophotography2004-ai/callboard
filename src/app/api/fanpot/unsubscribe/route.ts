import { updateStore } from "@/lib/store";

export const dynamic = "force-dynamic";

async function unsubscribe(token: string) {
  if (!token) return false;
  return updateStore((store) => {
    const fan = (store.fans || []).find((f) => f.unsubToken === token);
    if (!fan) return false;
    fan.status = "unsubscribed";
    fan.unsubscribedAt = new Date().toISOString();
    return true;
  }).catch(() => false);
}

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") || "";
  const ok = await unsubscribe(token);
  return Response.redirect(new URL(ok ? "/join/unsubscribed" : "/join/unsubscribed?invalid=1", req.url), 303);
}

/** RFC 8058 one-click unsubscribe (mail clients POST here). */
export async function POST(req: Request) {
  const token = new URL(req.url).searchParams.get("token") || "";
  const ok = await unsubscribe(token);
  return Response.json({ ok }, { status: ok ? 200 : 404 });
}
