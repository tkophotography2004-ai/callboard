import { appendFile, mkdir } from "fs/promises";
import { join } from "path";
import { APP_NAME, APP_NAME_MARK, siteUrl } from "./config";
import { BRIUNKA_EMAIL } from "./rules";

export type SignupNotice = {
  email: string;
  displayName: string;
  username: string;
  cashtag: string;
  createdAt: string;
};

function notifyTo() {
  return (process.env.NOTIFY_TO || BRIUNKA_EMAIL).trim();
}

function notifyFrom() {
  return (process.env.NOTIFY_FROM || process.env.SMTP_USER || BRIUNKA_EMAIL).trim();
}

export async function notifyHouseSignup(user: SignupNotice) {
  const subject = `${APP_NAME_MARK} signup — ${user.displayName} (@${user.username})`;
  const body = [
    `A new account just signed up on ${APP_NAME_MARK}.`,
    "",
    `Name: ${user.displayName}`,
    `Username: @${user.username}`,
    `Email: ${user.email}`,
    `Cash App: ${user.cashtag}`,
    `Time: ${user.createdAt}`,
    "",
    `Admin: ${siteUrl()}/admin`,
  ].join("\n");

  try {
    await logSignup(subject, body);
  } catch {
    /* keep going */
  }

  try {
    if (process.env.SMTP_PASS) {
      const sent = await sendSmtp(subject, body);
      if (sent) return;
    }
    await sendFormSubmit(subject, user);
  } catch {
    /* signup must not fail if mail fails */
  }
}

async function logSignup(subject: string, body: string) {
  const dir = join(process.cwd(), "logs");
  await mkdir(dir, { recursive: true });
  const line = `${new Date().toISOString()} ${subject} | ${body.replace(/\r?\n/g, " / ")}\n`;
  await appendFile(join(dir, "signups.log"), line);
}

async function sendSmtp(subject: string, body: string) {
  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER || notifyFrom(),
        pass: process.env.SMTP_PASS,
      },
    });
    await transporter.sendMail({
      from: notifyFrom(),
      to: notifyTo(),
      subject,
      text: body,
    });
    return true;
  } catch {
    return false;
  }
}

async function sendFormSubmit(subject: string, user: SignupNotice) {
  const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(notifyTo())}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      _subject: subject,
      _template: "table",
      _captcha: "false",
      name: user.displayName,
      username: user.username,
      email: user.email,
      cashtag: user.cashtag,
      signed_up: user.createdAt,
    }),
  });
  return res.ok;
}

export type ResetMail = {
  to: string;
  resetUrl: string;
  displayName: string;
};

/** Send password-reset link to the account holder (SMTP when configured). */
export async function sendPasswordResetEmail(mail: ResetMail): Promise<boolean> {
  const subject = `${APP_NAME_MARK} password reset`;
  const body = [
    `Hi ${mail.displayName || "there"},`,
    "",
    `We got a request to reset your ${APP_NAME_MARK} password.`,
    "",
    `Open this link within the next hour:`,
    mail.resetUrl,
    "",
    `If you did not ask for this, you can ignore this email.`,
    "",
    siteUrl(),
  ].join("\n");

  try {
    if (process.env.SMTP_PASS) {
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: Number(process.env.SMTP_PORT || 587),
        secure: false,
        auth: {
          user: process.env.SMTP_USER || notifyFrom(),
          pass: process.env.SMTP_PASS,
        },
      });
      await transporter.sendMail({
        from: notifyFrom(),
        to: mail.to,
        subject,
        text: body,
      });
      return true;
    }
  } catch (err) {
    console.error("password reset SMTP failed", err instanceof Error ? err.message : err);
  }

  // FormSubmit fallback may require recipient confirmation the first time.
  try {
    const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(mail.to)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        _subject: subject,
        _template: "box",
        _captcha: "false",
        message: body,
        reset_url: mail.resetUrl,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export type OutgoingMail = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  headers?: Record<string, string>;
};

function fromHeader() {
  const f = notifyFrom();
  // NOTIFY_FROM may already carry a display name ("Name <addr>"); only wrap a bare address.
  return f.includes("<") ? f : `${APP_NAME} <${f}>`;
}

/** Send one email through the site's Gmail SMTP setup (same transport as signup alerts / password reset). */
export async function sendSiteMail(mail: OutgoingMail): Promise<boolean> {
  if (!process.env.SMTP_PASS) {
    console.error("sendSiteMail: SMTP_PASS not set");
    return false;
  }
  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER || notifyFrom(),
        pass: process.env.SMTP_PASS,
      },
    });
    const info = await transporter.sendMail({
      from: fromHeader(),
      to: mail.to,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
      headers: mail.headers,
    });
    console.log("sendSiteMail ok", { accepted: info.accepted?.length || 0, rejected: info.rejected?.length || 0, response: String(info.response || "").slice(0, 80) });
    return (info.accepted?.length || 0) > 0;
  } catch (err) {
    console.error("sendSiteMail failed", err instanceof Error ? err.message : err);
    return false;
  }
}

export type FanNotice = {
  firstName: string;
  email: string;
  ref: string;
  confirmedAt: string;
  test: boolean;
};

/** House alert (to NOTIFY_TO) when a fan confirms — same Gmail alert path as new accounts. */
export async function notifyHouseFan(fan: FanNotice) {
  const subject = `${APP_NAME_MARK} fan pot — ${fan.firstName} confirmed${fan.test ? " (TEST)" : ""}`;
  const body = [
    `A new fan just confirmed for the ${APP_NAME_MARK} fan pot.`,
    "",
    `Name: ${fan.firstName}`,
    `Email: ${fan.email}`,
    `Ref: ${fan.ref || "(none)"}`,
    `Time: ${fan.confirmedAt}`,
    fan.test ? "Marked as TEST signup." : "",
    "",
    `Admin: ${siteUrl()}/admin`,
  ]
    .filter((l, i, a) => l !== "" || a[i - 1] !== "")
    .join("\n");
  try {
    await logSignup(subject, body);
  } catch {
    /* keep going */
  }
  try {
    if (process.env.SMTP_PASS) {
      const sent = await sendSmtp(subject, body);
      if (sent) return;
    }
  } catch {
    /* alert must not break confirm */
  }
}
