import { createHash, randomBytes } from "crypto";
import { siteUrl } from "./config";
import { formatUsd, FAN_POT_SEED_CENTS } from "./rules";
import type { FanContact, Store } from "./types";

export const FANPOT_SHARE_URL = "https://scrollcalllive.com/join?ref=fanpot";
export const FANPOT_TOKEN_TTL_MS = 48 * 60 * 60 * 1000;
export const FANPOT_RATE_LIMIT = 5;
export const FANPOT_RATE_WINDOW_MS = 60 * 60 * 1000;
export const MAIL_FOOTER_LINE = "Scroll Call · Edwards, Mississippi";

export function newToken() {
  return randomBytes(24).toString("base64url");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function hashIp(ip: string) {
  return createHash("sha256").update(`fanpot:${ip}`).digest("hex").slice(0, 24);
}

export function isTestRef(ref: string) {
  return /^test/i.test(ref);
}

export function cleanRef(raw: string) {
  return raw.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40);
}

export function cleanFirstName(raw: string) {
  return raw.replace(/[\r\n<>]/g, "").trim().slice(0, 40);
}

/** Current displayed fan pot in cents (week pot, never below the seed). */
export function fanPotCents(store: Store) {
  const seed = store.fanPotSeedCents || FAN_POT_SEED_CENTS;
  const week = store.fanWeeks?.find((w) => w.status === "open");
  return Math.max(seed, week?.potCents || 0);
}

export function fanPotLabel(store: Store) {
  return formatUsd(fanPotCents(store));
}

/** Record one attempt for this IP and report whether it is over the limit. */
export function rateLimited(store: Store, ipKey: string, now = Date.now()) {
  if (!store.fanRate) store.fanRate = {};
  for (const [k, list] of Object.entries(store.fanRate)) {
    const kept = list.filter((t) => now - t < FANPOT_RATE_WINDOW_MS);
    if (kept.length) store.fanRate[k] = kept;
    else delete store.fanRate[k];
  }
  const hits = store.fanRate[ipKey] || [];
  if (hits.length >= FANPOT_RATE_LIMIT) return true;
  hits.push(now);
  store.fanRate[ipKey] = hits;
  return false;
}

function base() {
  return siteUrl().replace(/\/$/, "");
}

export function confirmUrl(token: string) {
  return `${base()}/api/fanpot/confirm?token=${encodeURIComponent(token)}`;
}

export function unsubscribeUrl(fan: FanContact) {
  return `${base()}/api/fanpot/unsubscribe?token=${encodeURIComponent(fan.unsubToken)}`;
}

export function unsubscribeHeaders(fan: FanContact) {
  return {
    "List-Unsubscribe": `<${unsubscribeUrl(fan)}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function button(href: string, label: string, primary = true) {
  const style = primary
    ? "background:#c47a4a;color:#09080a;"
    : "background:transparent;color:#f3ead8;border:1px solid #6b5a4c;";
  return `<a href="${esc(href)}" style="${style}display:inline-block;padding:14px 22px;margin:6px 8px 6px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;text-decoration:none;">${esc(label)}</a>`;
}

function layout(inner: string, fan: FanContact) {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#09080a;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#09080a;"><tr><td align="center" style="padding:28px 14px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#100e12;border:1px solid #2a232c;">
<tr><td style="padding:28px 26px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:#f3ead8;">
<p style="margin:0 0 18px;font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#c47a4a;">Scroll Call&reg; · Fan Pot</p>
${inner}
</td></tr>
<tr><td style="padding:16px 26px 24px;border-top:1px solid #2a232c;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#a89f94;">
${MAIL_FOOTER_LINE}<br>
<a href="${esc(unsubscribeUrl(fan))}" style="color:#e0b088;">Unsubscribe</a> · <a href="${esc(base())}/terms" style="color:#e0b088;">Terms</a>
</td></tr></table></td></tr></table></body></html>`;
}

function textFooter(fan: FanContact) {
  return ["", "—", MAIL_FOOTER_LINE, `Unsubscribe: ${unsubscribeUrl(fan)}`].join("\n");
}

export function confirmEmail(fan: FanContact, token: string) {
  const name = fan.firstName || "friend";
  const url = confirmUrl(token);
  const subject = `Confirm you're in, ${name} 🎶`;
  const html = layout(
    `<h1 style="margin:0 0 14px;font-family:Georgia,serif;font-size:28px;font-weight:normal;color:#f3ead8;">One tap to join, ${esc(name)}.</h1>
<p style="margin:0 0 18px;color:#c8c0b4;">Tap below to join the Scroll Call fan pot. Fans vote free, and winners get paid weekly.</p>
<p style="margin:0 0 18px;">${button(url, "Yes, count me in")}</p>
<p style="margin:0 0 8px;font-size:13px;color:#a89f94;">This link works for 48 hours.</p>
<p style="margin:0;font-size:13px;color:#a89f94;">If you didn't sign up, ignore this.</p>`,
    fan,
  );
  const text = [
    `Hi ${name},`,
    "",
    "One tap to join the Scroll Call fan pot. Fans vote free, winners get paid weekly.",
    "",
    "Yes, count me in:",
    url,
    "",
    "This link works for 48 hours.",
    "If you didn't sign up, ignore this.",
    textFooter(fan),
  ].join("\n");
  return { subject, html, text };
}

export function welcomeEmail(fan: FanContact, potLabel: string) {
  const name = fan.firstName || "friend";
  const subject = "You're in. Welcome to Scroll Call (beta)";
  const html = layout(
    `<h1 style="margin:0 0 14px;font-family:Georgia,serif;font-size:28px;font-weight:normal;color:#f3ead8;">You're in, ${esc(name)}.</h1>
<p style="margin:0 0 14px;color:#c8c0b4;">Scroll Call is in beta, and you're early.</p>
<p style="margin:0 0 14px;color:#c8c0b4;">Creators drop music, music videos, and films. Fans vote. Top picks are crowned winners every week, and winners arrive by email on Fridays.</p>
<p style="margin:0 0 18px;color:#c8c0b4;">The fan pot is <strong style="color:#f3ead8;">${esc(potLabel)}</strong> right now and growing, and it's free to be part of.</p>
<p style="margin:0 0 22px;">${button(base() + "/", "Go vote now")}${button(FANPOT_SHARE_URL, "Share Scroll Call", false)}</p>
<p style="margin:0;color:#f3ead8;">See you in the lounges,<br>Tina &amp; the Scroll Call team</p>`,
    fan,
  );
  const text = [
    `You're in, ${name}.`,
    "",
    "Scroll Call is in beta, and you're early.",
    "",
    "Creators drop music, music videos, and films. Fans vote. Top picks are crowned winners every week, and winners arrive by email on Fridays.",
    "",
    `The fan pot is ${potLabel} right now and growing, and it's free to be part of.`,
    "",
    `Go vote now: ${base()}/`,
    `Share Scroll Call: ${FANPOT_SHARE_URL}`,
    "",
    "See you in the lounges,",
    "Tina & the Scroll Call team",
    textFooter(fan),
  ].join("\n");
  return { subject, html, text };
}

/** Optional: add a confirmed contact to a Resend audience. Inert unless both env vars exist. */
export async function syncResendContact(fan: FanContact) {
  const key = process.env.RESEND_API_KEY;
  const audience = process.env.RESEND_AUDIENCE_ID;
  if (!key || !audience || fan.test) return false;
  try {
    const res = await fetch(`https://api.resend.com/audiences/${encodeURIComponent(audience)}/contacts`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email: fan.email, first_name: fan.firstName, unsubscribed: false }),
    });
    return res.ok;
  } catch (err) {
    console.error("resend sync failed", err instanceof Error ? err.message : err);
    return false;
  }
}

export function fansCsv(fans: FanContact[]) {
  const q = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = [["first_name", "email", "status", "created_at", "confirmed_at", "ref", "test"].join(",")];
  for (const f of fans) {
    rows.push(
      [f.firstName, f.email, f.status, f.createdAt, f.confirmedAt || "", f.ref, f.test ? "yes" : ""].map(q).join(","),
    );
  }
  return rows.join("\n") + "\n";
}
