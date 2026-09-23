import type { Arena } from "@/lib/rules";

export type EmbedKind =
  | "youtube"
  | "tiktok"
  | "instagram"
  | "vimeo"
  | "soundcloud"
  | "spotify"
  | "audiomack";

export type ParsedEmbed = {
  kind: EmbedKind;
  id: string;
  src: string;
  original: string;
};

/** Blind: music platforms + TikTok. */
const BLIND_KINDS = new Set<EmbedKind>(["youtube", "soundcloud", "spotify", "audiomack", "tiktok"]);
/** Track lounge: Blind set + Instagram (no Vimeo). */
const TRACKS_KINDS = new Set<EmbedKind>(["youtube", "soundcloud", "spotify", "audiomack", "tiktok", "instagram"]);
/** Film / Music Video / Creator. */
const VIDEO_KINDS = new Set<EmbedKind>(["youtube", "tiktok", "instagram", "vimeo"]);

export function isAudioEmbed(kind: EmbedKind) {
  return kind === "soundcloud" || kind === "spotify" || kind === "audiomack";
}

export function kindsForArena(arena: Arena): Set<EmbedKind> {
  if (arena === "blind") return BLIND_KINDS;
  if (arena === "tracks") return TRACKS_KINDS;
  return VIDEO_KINDS;
}

export function linkHelp(arena: Arena) {
  if (arena === "blind") {
    return "Paste a YouTube, SoundCloud, Spotify, Audiomack, or TikTok link.";
  }
  if (arena === "tracks") {
    return "Paste a YouTube, SoundCloud, Spotify, Audiomack, TikTok, or Instagram link.";
  }
  return "Paste a YouTube, TikTok, Instagram, or Vimeo link.";
}

export function embedAllowed(embed: ParsedEmbed, arena: Arena) {
  return kindsForArena(arena).has(embed.kind);
}

export function parseEmbed(raw: string | null | undefined): ParsedEmbed | null {
  const t = String(raw || "").trim();
  if (!t) return null;
  try {
    const u = new URL(t.startsWith("http") ? t : `https://${t}`);
    const host = u.hostname.replace(/^www\./, "");
    const path = u.pathname.split("/").filter(Boolean);

    if (host === "youtu.be") {
      const id = u.pathname.replace(/^\//, "").slice(0, 20);
      if (id) return { kind: "youtube", id, src: `https://www.youtube.com/embed/${id}`, original: t };
    }
    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com" || host === "youtube-nocookie.com") {
      const id = u.searchParams.get("v") || path.filter((p) => p !== "embed" && p !== "shorts" && p !== "live").pop() || "";
      const clean = id.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 20);
      if (clean) return { kind: "youtube", id: clean, src: `https://www.youtube.com/embed/${clean}`, original: t };
    }
    if (host === "tiktok.com" || host.endsWith(".tiktok.com")) {
      const m = u.pathname.match(/\/video\/(\d+)/);
      if (m) return { kind: "tiktok", id: m[1], src: `https://www.tiktok.com/embed/v2/${m[1]}`, original: t };
    }
    if (host === "instagram.com" || host === "instagr.am") {
      const m = u.pathname.match(/\/(p|reel|reels)\/([^/]+)/);
      if (m) {
        const code = m[2];
        return {
          kind: "instagram",
          id: code,
          src: `https://www.instagram.com/${m[1] === "p" ? "p" : "reel"}/${code}/embed`,
          original: t,
        };
      }
    }
    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const id = path.filter((p) => /^\d+$/.test(p)).pop();
      if (id) return { kind: "vimeo", id, src: `https://player.vimeo.com/video/${id}`, original: t };
    }
    if (host === "soundcloud.com" || host === "m.soundcloud.com" || host === "on.soundcloud.com") {
      if (path.length >= 1) {
        const canonical = `${u.protocol}//${u.hostname}${u.pathname}`;
        return {
          kind: "soundcloud",
          id: path.slice(0, 2).join("/"),
          src: `https://w.soundcloud.com/player/?url=${encodeURIComponent(canonical)}&color=%23c4a574&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&visual=true`,
          original: t,
        };
      }
    }
    if (host === "open.spotify.com") {
      const parts = path.filter((p) => !p.startsWith("intl-"));
      const type = parts[0];
      const id = (parts[1] || "").replace(/[^a-zA-Z0-9]/g, "");
      if ((type === "track" || type === "album" || type === "episode" || type === "playlist") && id) {
        return {
          kind: "spotify",
          id,
          src: `https://open.spotify.com/embed/${type}/${id}`,
          original: t,
        };
      }
    }
    if (host === "audiomack.com") {
      if (path[0] === "song" && path[1] && path[2]) {
        return {
          kind: "audiomack",
          id: `${path[1]}/${path[2]}`,
          src: `https://audiomack.com/embed/song/${path[1]}/${path[2]}`,
          original: t,
        };
      }
      if (path[1] === "song" && path[0] && path[2]) {
        return {
          kind: "audiomack",
          id: `${path[0]}/${path[2]}`,
          src: `https://audiomack.com/embed/song/${path[0]}/${path[2]}`,
          original: t,
        };
      }
    }
  } catch {
    return null;
  }
  return null;
}


/** Short TikTok / share hosts that need a redirect to get /video/ID. */
function isTikTokShortHost(host: string) {
  return (
    host === "vm.tiktok.com" ||
    host === "vt.tiktok.com" ||
    host === "m.tiktok.com" ||
    host === "tiktok.com" ||
    host.endsWith(".tiktok.com")
  );
}

function looksLikeTikTokShort(raw: string) {
  try {
    const u = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "vm.tiktok.com" || host === "vt.tiktok.com") return true;
    if (host === "tiktok.com" || host.endsWith(".tiktok.com")) {
      // /t/XXXX share links, or missing /video/
      if (u.pathname.startsWith("/t/")) return true;
      if (!/\/video\/\d+/.test(u.pathname)) return true;
    }
    return false;
  } catch {
    return false;
  }
}

/** Stable URL that parseEmbed can re-parse without a network round-trip. */
export function playableMediaUrl(embed: ParsedEmbed): string {
  switch (embed.kind) {
    case "youtube":
      return `https://www.youtube.com/watch?v=${embed.id}`;
    case "tiktok":
      return `https://www.tiktok.com/@_/video/${embed.id}`;
    case "instagram":
      return `https://www.instagram.com/reel/${embed.id}/`;
    case "vimeo":
      return `https://vimeo.com/${embed.id}`;
    case "spotify":
      return embed.original.includes("open.spotify.com") ? embed.original : `https://open.spotify.com/track/${embed.id}`;
    case "soundcloud":
    case "audiomack":
      return embed.original;
    default:
      return embed.original;
  }
}

/** Follow one redirect chain (TikTok short links) then parse. */
export async function resolveAndParseEmbed(raw: string | null | undefined): Promise<ParsedEmbed | null> {
  const t = String(raw || "").trim();
  if (!t) return null;
  const direct = parseEmbed(t);
  if (direct) return direct;
  if (!looksLikeTikTokShort(t)) return null;
  try {
    const start = t.startsWith("http") ? t : `https://${t}`;
    const res = await fetch(start, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(8000),
    });
    const finalUrl = res.url || start;
    const parsed = parseEmbed(finalUrl);
    if (parsed) return { ...parsed, original: t };
    // Some TikTok responses keep short URL in res.url but put canonical in HTML
    const html = await res.text();
    const m =
      html.match(/https?:\/\/www\.tiktok\.com\/@[^"'\s]+\/video\/(\d+)/) ||
      html.match(/\/video\/(\d+)/);
    if (m) {
      const id = m[1];
      return {
        kind: "tiktok",
        id,
        src: `https://www.tiktok.com/embed/v2/${id}`,
        original: t,
      };
    }
  } catch {
    return null;
  }
  return null;
}

export function isRemoteMedia(path: string | null | undefined) {
  const t = String(path || "");
  return t.startsWith("http://") || t.startsWith("https://") || Boolean(parseEmbed(t));
}
