export function slugify(input: string) {
  const base = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
  return base || "untitled";
}

export function uniqueSlug(base: string, taken: Set<string>) {
  let slug = slugify(base);
  let i = 2;
  while (taken.has(slug)) {
    slug = `${slugify(base)}-${i}`;
    i += 1;
  }
  return slug;
}

export function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const s = Math.round(seconds);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function compact(n: number) {
  if (n < 1000) return String(n);
  if (n < 10_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return `${Math.round(n / 1000)}k`;
}

function asUrl(raw: string, prefix?: string) {
  const t = raw.trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t.slice(0, 200);
  if (t.startsWith("@")) {
    const handle = t.slice(1);
    return prefix ? `${prefix}${handle}` : t;
  }
  if (prefix && !t.includes(".")) return `${prefix}${t.replace(/^\/+/, "")}`;
  if (t.includes(".")) return `https://${t.replace(/^\/+/, "")}`.slice(0, 200);
  return prefix ? `${prefix}${t}` : t;
}

export function readArtistLinks(data: FormData | Record<string, string>) {
  const get = (key: string) =>
    data instanceof FormData ? String(data.get(key) || "") : String(data[key] || "");
  return {
    instagram: asUrl(get("instagram"), "https://instagram.com/"),
    tiktok: asUrl(get("tiktok"), "https://www.tiktok.com/@"),
    youtube: asUrl(get("youtube"), "https://youtube.com/"),
    spotify: asUrl(get("spotify"), "https://open.spotify.com/"),
    appleMusic: asUrl(get("appleMusic"), "https://music.apple.com/"),
    other: asUrl(get("other")),
  };
}

export function hasAnyLink(links?: { instagram?: string; tiktok?: string; youtube?: string; spotify?: string; appleMusic?: string; other?: string } | null) {
  if (!links) return false;
  return Boolean(links.instagram || links.tiktok || links.youtube || links.spotify || links.appleMusic || links.other);
}
