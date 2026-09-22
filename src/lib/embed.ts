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

const AUDIO_KINDS = new Set<EmbedKind>(["youtube", "soundcloud", "spotify", "audiomack"]);
const VIDEO_KINDS = new Set<EmbedKind>(["youtube", "tiktok", "instagram", "vimeo"]);

export function isAudioEmbed(kind: EmbedKind) {
  return kind === "soundcloud" || kind === "spotify" || kind === "audiomack";
}

export function linkHelp(audioLounge: boolean) {
  return audioLounge
    ? "Paste a YouTube, SoundCloud, Spotify, or Audiomack link."
    : "Paste a YouTube, TikTok, Instagram, or Vimeo link.";
}

export function embedAllowed(embed: ParsedEmbed, audioLounge: boolean) {
  return (audioLounge ? AUDIO_KINDS : VIDEO_KINDS).has(embed.kind);
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
    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
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

export function isRemoteMedia(path: string | null | undefined) {
  const t = String(path || "");
  return t.startsWith("http://") || t.startsWith("https://") || Boolean(parseEmbed(t));
}
