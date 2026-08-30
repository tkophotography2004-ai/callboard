/** ISO week id like 2026-W36. Weeks run Monday 00:00 UTC → Sunday 23:59 UTC. */
export function isoWeekId(date = new Date()) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function previousWeekId(weekId: string) {
  const { start } = weekRange(weekId);
  const prev = new Date(start.getTime() - 3 * 86400000);
  return isoWeekId(prev);
}

export function weekRange(weekId: string) {
  const m = /^(\d{4})-W(\d{2})$/.exec(weekId);
  if (!m) {
    const now = new Date();
    return weekRange(isoWeekId(now));
  }
  const year = Number(m[1]);
  const week = Number(m[2]);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const day = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - day + 1 + (week - 1) * 7);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 7);
  sunday.setUTCMilliseconds(-1);
  return { start: monday, end: sunday };
}

export function weekLabel(weekId: string) {
  const { start, end } = weekRange(weekId);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  return `${fmt(start)} – ${fmt(end)}`;
}

export function msUntilWeekEnd(weekId: string) {
  return Math.max(0, weekRange(weekId).end.getTime() - Date.now());
}

export function formatCountdown(ms: number) {
  const total = Math.floor(ms / 1000);
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
