import { notifyHouseFan, sendSiteMail } from "@/lib/notify";
import { updateStore } from "@/lib/store";
import { fanPotLabel, hashToken, syncResendContact, unsubscribeHeaders, welcomeEmail } from "@/lib/fanpot";
import type { FanContact } from "@/lib/types";

export const dynamic = "force-dynamic";

function go(req: Request, path: string) {
  return Response.redirect(new URL(path, req.url), 303);
}

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") || "";
  if (!token) return go(req, "/join?invalid=1");
  const h = hashToken(token);
  const now = new Date();

  const result = await updateStore((store) => {
    const fan = (store.fans || []).find((f) => f.confirmTokenHash === h);
    if (!fan) return { state: "invalid" as const };
    if (fan.status === "confirmed") return { state: "already" as const };
    if (Date.parse(fan.confirmExpiresAt) < now.getTime()) return { state: "expired" as const };
    fan.status = "confirmed";
    fan.confirmedAt = now.toISOString();
    fan.unsubscribedAt = null;
    return { state: "confirmed" as const, fan: { ...fan } as FanContact, pot: fanPotLabel(store) };
  }).catch((err: Error) => err);

  if (result instanceof Error) {
    console.error("fanpot confirm failed", result.message);
    return go(req, "/join?error=1");
  }
  if (result.state === "invalid") return go(req, "/join?invalid=1");
  if (result.state === "expired") return go(req, "/join?expired=1");
  if (result.state === "already") return go(req, "/join/confirmed");

  const fan = result.fan;
  const mail = welcomeEmail(fan, result.pot);
  await Promise.allSettled([
    sendSiteMail({ to: fan.email, subject: mail.subject, text: mail.text, html: mail.html, headers: unsubscribeHeaders(fan) }),
    notifyHouseFan({
      firstName: fan.firstName,
      email: fan.email,
      ref: fan.ref,
      confirmedAt: fan.confirmedAt || now.toISOString(),
      test: fan.test,
    }),
    syncResendContact(fan),
  ]);
  return go(req, "/join/confirmed");
}
