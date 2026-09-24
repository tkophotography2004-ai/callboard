import { createHash } from "crypto";
import { setSession } from "@/lib/auth";
import { json } from "@/lib/api";
import { hashPassword } from "@/lib/password";
import { PUBLIC_CLOSED } from "@/lib/rules";
import { updateStore } from "@/lib/store";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(req: Request) {
  if (PUBLIC_CLOSED) {
    return json({ error: "Scroll Call is paused. Check back when the house reopens." }, 503);
  }
  const body = (await req.json().catch(() => ({}))) as {
    token?: string;
    password?: string;
  };
  const token = (body.token || "").trim();
  const password = body.password || "";
  if (!token) return json({ error: "Reset link is missing or expired." }, 400);
  if (password.length < 8) return json({ error: "Password must be at least 8 characters." }, 400);

  const tokenHash = hashToken(token);
  const passwordHash = await hashPassword(password);

  const result = await updateStore((store) => {
    if (!store.passwordResets) store.passwordResets = [];
    const now = Date.now();
    store.passwordResets = store.passwordResets.filter(
      (r) => new Date(r.expiresAt).getTime() > now,
    );
    const reset = store.passwordResets.find((r) => r.tokenHash === tokenHash);
    if (!reset) return { ok: false as const, userId: "" };
    const user = store.users.find((u) => u.id === reset.userId);
    if (!user || user.disabled) return { ok: false as const, userId: "" };
    user.passwordHash = passwordHash;
    store.passwordResets = store.passwordResets.filter((r) => r.userId !== user.id);
    return { ok: true as const, userId: user.id };
  });

  if (!result.ok) {
    return json({ error: "Reset link is invalid or expired. Request a new one." }, 400);
  }
  await setSession(result.userId);
  return json({ ok: true });
}
