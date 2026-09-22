import { assetUrl } from "./config";
import type { Store } from "./types";

export function crateUrl() {
  return (process.env.CRATE_URL || "http://localhost:3060").replace(/\/$/, "");
}

export function crateSecret() {
  return process.env.CRATE_INTAKE_SECRET || process.env.CALLBOARD_SECRET || "callboard-dev-secret-change-me";
}

export type CrateWinner = {
  entryId: string;
  title: string;
  artist: string;
  weekId: string;
  arena: string;
  place: string;
  coverUrl: string;
  email: string;
  displayName: string;
  username: string;
  links: {
    spotify: string;
    youtube: string;
    appleMusic: string;
    other: string;
  };
};

export function collectCrateWinners(store: Store): CrateWinner[] {
  const seen = new Set<string>();
  const rows: CrateWinner[] = [];

  for (const week of store.weeks.filter((w) => w.status === "closed")) {
    const places = new Map<string, string>();
    for (const id of week.cutWinnerIds || []) places.set(id, places.get(id) || "cut");
    if (week.heatWinnerId) places.set(week.heatWinnerId, "heat");
    for (const p of store.payouts.filter((x) => x.weekId === week.id && x.arena === week.arena && !x.place.startsWith("fan-"))) {
      places.set(p.entryId, p.place);
    }

    for (const [entryId, place] of places) {
      if (seen.has(entryId)) continue;
      const entry = store.entries.find((e) => e.id === entryId);
      const user = entry ? store.users.find((u) => u.id === entry.userId) : null;
      if (!entry || !user) continue;
      if (entry.arena === "film") continue;
      seen.add(entryId);
      rows.push({
        entryId: entry.id,
        title: entry.title,
        artist: user.displayName,
        weekId: week.id,
        arena: week.arena,
        place,
        coverUrl: assetUrl(entry.coverPath),
        email: user.email,
        displayName: user.displayName,
        username: user.username,
        links: {
          spotify: entry.links?.spotify || user.links?.spotify || "",
          youtube: entry.links?.youtube || user.links?.youtube || "",
          appleMusic: entry.links?.appleMusic || user.links?.appleMusic || "",
          other: entry.links?.other || user.links?.other || "",
        },
      });
    }
  }

  return rows;
}

export async function pushWinnersToCrate(winners: CrateWinner[]) {
  const res = await fetch(`${crateUrl()}/api/intake/winner`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${crateSecret()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ winners }),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string; results?: unknown };
  if (!res.ok) {
    throw new Error(data.error || `Crate intake failed (${res.status}). Is Crate running at ${crateUrl()}?`);
  }
  return data;
}
