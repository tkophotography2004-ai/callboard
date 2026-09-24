import { createHash, randomBytes } from "crypto";
import { json } from "@/lib/api";
import { siteUrl } from "@/lib/config";
import { emailOk } from "@/lib/email";
import { sendPasswordResetEmail } from "@/lib/notify";
import { PUBLIC_CLOSED } from "@/lib/rules";
import { updateStore } from "@/lib/store";

const RESET_TTL_MS = 60 * 60 * 1000;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(req: Request) {
  if (PUBLIC_CLOSED) {
    return json({ error: "Scroll Call is paused. Check back when the house reopens." }, 503);
  }
  const body = (await req.json().catch(() => ({}))) as { email?: string };
  const email = (body.email || "").trim().toLowerCase();
  if (!emailOk(email)) {
    return json({ error: "Enter the email on your account." }, 400);
  }

  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + RESET_TTL_MS).toISOString();
  const createdAt = new Date().toISOString();

  const result = await updateStore((store) => {
    if (!store.passwordResets) store.passwordResets = [];
    const user = store.users.find((u) => u.email === email && !u.disabled);
    // Always look successful to avoid account enumeration.
    if (!user) return { sent: false as const, displayName: "" };
    store.passwordResets = store.passwordResets.filter(
      (r) => r.userId !== user.id && new Date(r.expiresAt).getTime() > Date.now(),
    );
    store.passwordResets.push({
      tokenHash,
      userId: user.id,
      email: user.email,
      expiresAt,
      createdAt,
    });
    return { sent: true as const, displayName: user.displayName };
  });

  const resetUrl = `${siteUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  let emailed = false;
  if (result.sent) {
    emailed = await sendPasswordResetEmail({
      to: email,
      resetUrl,
      displayName: result.displayName,
    });
  }

  const echo =
    process.env.SCROLLCALL_ECHO_RESET === "1" ||
    process.env.CALLBOARD_ECHO_RESET === "1";

  const payload: Record<string, unknown> = {
    ok: true,
    message:
      "If that email is on an account, we sent a reset link. Check your inbox (and spam).",
  };
  if (echo && result.sent) {
    payload.resetUrl = resetUrl;
    payload.emailed = emailed;
  }
  return json(payload);
}
