import { nanoid } from "nanoid";
import { clientIp, json } from "@/lib/api";
import { emailOk } from "@/lib/rules";
import { sendSiteMail } from "@/lib/notify";
import { updateStore } from "@/lib/store";
import {
  FANPOT_TOKEN_TTL_MS,
  cleanFirstName,
  cleanRef,
  confirmEmail,
  hashIp,
  hashToken,
  isTestRef,
  newToken,
  rateLimited,
  unsubscribeHeaders,
} from "@/lib/fanpot";
import type { FanContact } from "@/lib/types";

export const dynamic = "force-dynamic";

async function readBody(req: Request): Promise<Record<string, string>> {
  const type = req.headers.get("content-type") || "";
  if (type.includes("application/json")) {
    const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    return Object.fromEntries(Object.entries(b).map(([k, v]) => [k, String(v ?? "")]));
  }
  const form = await req.formData().catch(() => null);
  if (!form) return {};
  const out: Record<string, string> = {};
  form.forEach((v, k) => {
    if (typeof v === "string") out[k] = v;
  });
  return out;
}

export async function POST(req: Request) {
  const body = await readBody(req);
  const wantsHtml = !(req.headers.get("content-type") || "").includes("application/json") &&
    (req.headers.get("accept") || "").includes("text/html");

  // Honeypot: bots fill hidden "website". Pretend success, store nothing.
  if ((body.website || "").trim()) {
    return wantsHtml ? Response.redirect(new URL("/join?sent=1", req.url), 303) : json({ ok: true, sent: true });
  }

  const firstName = cleanFirstName(body.firstName || "");
  const email = (body.email || "").trim().toLowerCase();
  const ref = cleanRef(body.ref || "");
  if (!firstName) return json({ error: "Enter your first name." }, 400);
  if (!emailOk(email)) return json({ error: "Enter a real email address. Test and disposable domains are not allowed." }, 400);

  const ipKey = hashIp(clientIp(req));
  const token = newToken();
  const now = new Date();

  const result = await updateStore((store) => {
    if (rateLimited(store, ipKey, now.getTime())) return { limited: true as const };
    const fans = store.fans!;
    let fan = fans.find((f) => f.email === email);
    if (fan && fan.status === "confirmed") return { already: true as const, fan: { ...fan } };
    if (!fan) {
      fan = {
        id: `f_${nanoid(10)}`,
        firstName,
        email,
        status: "pending",
        ref,
        test: isTestRef(ref),
        confirmTokenHash: "",
        confirmExpiresAt: "",
        unsubToken: newToken(),
        createdAt: now.toISOString(),
        confirmedAt: null,
        unsubscribedAt: null,
        lastSentAt: "",
      } satisfies FanContact;
      fans.push(fan);
    } else {
      fan.firstName = firstName;
      fan.status = "pending";
      fan.unsubscribedAt = null;
      if (ref && !fan.ref) fan.ref = ref;
      if (isTestRef(ref)) fan.test = true;
    }
    fan.confirmTokenHash = hashToken(token);
    fan.confirmExpiresAt = new Date(now.getTime() + FANPOT_TOKEN_TTL_MS).toISOString();
    fan.lastSentAt = now.toISOString();
    return { fan: { ...fan } };
  }).catch((err: Error) => err);

  if (result instanceof Error) {
    console.error("fanpot join failed", result.message);
    return json({ error: "Could not save that right now. Try again in a minute." }, 500);
  }
  if ("limited" in result) return json({ error: "Too many tries from this connection. Try again in an hour." }, 429);
  if ("already" in result) {
    return wantsHtml
      ? Response.redirect(new URL("/join?already=1", req.url), 303)
      : json({ ok: true, already: true, message: "You're already in the fan pot." });
  }

  const mail = confirmEmail(result.fan, token);
  const sent = await sendSiteMail({
    to: result.fan.email,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
    headers: unsubscribeHeaders(result.fan),
  });
  if (!sent) return json({ error: "Saved, but the confirm email did not send. Try again shortly." }, 502);
  return wantsHtml ? Response.redirect(new URL("/join?sent=1", req.url), 303) : json({ ok: true, sent: true });
}
