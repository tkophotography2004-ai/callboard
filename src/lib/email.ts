const BLOCKED_EMAIL_DOMAINS = new Set([
  "example.com",
  "example.org",
  "example.net",
  "test",
  "localhost",
  "invalid",
  "email.invalid",
  "mailinator.com",
  "mailinator.net",
  "guerrillamail.com",
  "guerrillamail.net",
  "10minutemail.com",
  "tempmail.com",
  "throwaway.email",
  "yopmail.com",
  "trashmail.com",
  "getnada.com",
  "sharklasers.com",
  "mailnesia.com",
  "maildrop.cc",
]);

const BLOCKED_EMAIL_TLDS = new Set(["test", "localhost", "invalid", "example", "local"]);

export function emailOk(email: string) {
  const e = email.trim().toLowerCase();
  if (
    !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/.test(
      e,
    )
  ) {
    return false;
  }
  const domain = e.split("@")[1] || "";
  const labels = domain.split(".");
  const tld = labels[labels.length - 1] || "";
  if (tld.length < 2 || !/^[a-z]{2,24}$/.test(tld)) return false;
  if (BLOCKED_EMAIL_TLDS.has(tld)) return false;
  if (BLOCKED_EMAIL_DOMAINS.has(domain)) return false;
  if (domain.endsWith(".example.com") || domain.endsWith(".example.org") || domain.endsWith(".example.net")) {
    return false;
  }
  if (domain.includes("mailinator")) return false;
  return true;
}

export function normalizePaypalEmail(raw: string) {
  const t = raw.trim().toLowerCase();
  if (!t) return "";
  if (!emailOk(t)) return null;
  return t;
}
