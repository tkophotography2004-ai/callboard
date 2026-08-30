import { adminPassword, setAdminCookie } from "@/lib/auth";
import { json } from "@/lib/api";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { password?: string };
  if ((body.password || "") !== adminPassword()) return json({ error: "Wrong key." }, 401);
  await setAdminCookie();
  return json({ ok: true });
}
