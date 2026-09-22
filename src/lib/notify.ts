import { appendFile, mkdir } from "fs/promises";
import { join } from "path";
import { APP_NAME_MARK, siteUrl } from "./config";
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
