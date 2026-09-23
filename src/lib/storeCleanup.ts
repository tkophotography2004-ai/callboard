import type { Store } from "./types";

function isReservedOrFakeEmail(email: string) {
  const e = (email || "").trim().toLowerCase();
  const domain = e.split("@")[1] || "";
  const local = e.split("@")[0] || "";
  const tld = domain.split(".").pop() || "";
  if (!domain) return false;
  if (
    domain === "example.com" ||
    domain === "example.org" ||
    domain === "example.net" ||
    domain.endsWith(".example.com") ||
    domain.endsWith(".example.org") ||
    domain.endsWith(".example.net")
  ) {
    return true;
  }
  if (tld === "test" || tld === "localhost" || tld === "invalid" || tld === "example" || tld === "local") {
    return true;
  }
  if (domain === "mailinator.com" || domain.includes("mailinator")) return true;
  // Agent diagnostic signups: verify* / diag* on reserved domains (already covered),
  // or usernames that clearly match prior API probe patterns with non-real domains.
  if (/^(verify|diag)\d+$/i.test(local) && (domain.includes("example") || tld === "test")) return true;
  return false;
}

function isFakeTestAccount(u: { email: string; username: string; displayName?: string }) {
  const email = (u.email || "").toLowerCase();
  const username = (u.username || "").toLowerCase();
  const display = (u.displayName || "").toLowerCase();
  if (email.endsWith("@callboard.app")) return true;
  if (isReservedOrFakeEmail(email)) return true;
  if (/^(verify|diag)\d*$/i.test(username) && isReservedOrFakeEmail(email)) return true;
  if ((display === "verify" || display === "diag user") && isReservedOrFakeEmail(email)) return true;
  return false;
}

export function stripDemoPlaceholders(store: Store) {
  const seedUsers = store.users.filter((u) => isFakeTestAccount(u));
  if (!seedUsers.length) return false;
  const seedIds = new Set(seedUsers.map((u) => u.id));
  const foundingRemoved = seedUsers.filter((u) => u.earnedFoundingPass).length;
  store.users = store.users.filter((u) => !seedIds.has(u.id));
  store.entries = store.entries.filter(
    (e) => !seedIds.has(e.userId) && !/^e_(midnight|engine|tide|cash|glass|lot|season|last)$/.test(e.id),
  );
  const liveIds = new Set(store.entries.map((e) => e.id));
  store.votes = store.votes.filter((v) => liveIds.has(v.entryId));
  if (store.foundingPasses) {
    store.foundingPasses = store.foundingPasses.filter((p) => !seedIds.has(p.userId));
  }
  if (foundingRemoved > 0) {
    store.foundingPassCount = Math.max(0, (store.foundingPassCount || 0) - foundingRemoved);
  }
  if (store.weeklyGiveaway && seedIds.has(store.weeklyGiveaway.userId || "")) {
    store.weeklyGiveaway = { weekId: store.weeklyGiveaway.weekId, userId: null, username: "", displayName: "" };
  }
  return true;
}
