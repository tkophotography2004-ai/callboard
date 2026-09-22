import { setSession, verifyPassword } from "@/lib/auth";
import { json } from "@/lib/api";
import { PUBLIC_CLOSED } from "@/lib/rules";
import { readStore } from "@/lib/store";

export async function POST(req: Request) {
  if (PUBLIC_CLOSED) {
    return json({ error: "Scroll Call is paused. Check back when the house reopens." }, 503);
  }
  const body = (await req.json().catch(() => ({}))) as { email?: string; password?: string };
  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";
  const store = await readStore();
  const user = store.users.find((u) => u.email === email);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return json({ error: "Email or password is wrong." }, 400);
  }
  if (user.disabled) {
    return json({ error: "This account is paused while Scroll Call is offline." }, 403);
  }
  await setSession(user.id);
  return json({ ok: true });
}
