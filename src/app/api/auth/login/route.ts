import { setSession, verifyPassword } from "@/lib/auth";
import { json } from "@/lib/api";
import { readStore } from "@/lib/store";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { email?: string; password?: string };
  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";
  const store = await readStore();
  const user = store.users.find((u) => u.email === email);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return json({ error: "Email or password is wrong." }, 400);
  }
  await setSession(user.id);
  return json({ ok: true });
}
