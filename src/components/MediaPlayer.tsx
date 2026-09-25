"use client";

import { useEffect, useRef, useState } from "react";
import { isBlindMediaRoute } from "@/lib/blind";
import { isAudioEmbed, parseEmbed, type ParsedEmbed } from "@/lib/embed";
import { formatDuration } from "@/lib/format";
import { HOOK_SECONDS, type Arena } from "@/lib/rules";

type Props = {
  coverPath: string;
  mediaPath: string | null;
  arena: Arena;
  durationSeconds: number;
  hookStartSeconds?: number;
  autoPlay?: boolean;
  onPlay?: () => void;
  /** Blind / hidden-artist: in-app only — no outbound creator links. */
  anonymous?: boolean;
};

function isVideoPath(src: string | null) {
  if (!src) return false;
  return /\.(mp4|webm|mov)(\?|$)/i.test(src);
}

/** Privacy-minded embed URL for Blind (hide channel chrome where platforms allow). */
function blindEmbedSrc(embed: ParsedEmbed): string {
  if (embed.kind === "youtube") {
    return `https://www.youtube-nocookie.com/embed/${embed.id}`;
  }
  if (embed.kind === "soundcloud") {
    return embed.src
      .replace("show_user=true", "show_user=false")
      .replace("show_comments=false", "show_comments=false&show_user=false");
  }
  return embed.src;
}

export default function MediaPlayer({
  coverPath,
  mediaPath,
  arena,
  durationSeconds,
  hookStartSeconds = 0,
  autoPlay,
  onPlay,
  anonymous = false,
}: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  // Blind lounge: our own audio player only. Never a platform embed, never an outbound link.
  const blindLounge = arena === "blind";
  const embed = blindLounge ? null : parseEmbed(mediaPath);
  const video = blindLounge ? false : isVideoPath(mediaPath);
  const cap = Math.min(
    durationSeconds || HOOK_SECONDS,
    arena === "film" || arena === "video" || arena === "creator" ? 120 : HOOK_SECONDS,
  );
  const blind = anonymous;

  useEffect(() => {
    if (!autoPlay) return;
    void start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaPath, autoPlay]);

  async function start() {
    onPlay?.();
    if (video && videoRef.current) {
      videoRef.current.currentTime = hookStartSeconds;
      await videoRef.current.play().catch(() => undefined);
      setPlaying(true);
      return;
    }
    if (audioRef.current && mediaPath) {
      audioRef.current.currentTime = hookStartSeconds;
      await audioRef.current.play().catch(() => undefined);
      setPlaying(true);
    }
  }

  function pause() {
    videoRef.current?.pause();
    audioRef.current?.pause();
    setPlaying(false);
  }

  function onTime(current: number) {
    setT(current);
    const end = hookStartSeconds + cap;
    if (current >= end) {
      pause();
      if (videoRef.current) videoRef.current.currentTime = hookStartSeconds;
      if (audioRef.current) audioRef.current.currentTime = hookStartSeconds;
      setT(hookStartSeconds);
    }
  }

  const shown = Math.max(0, t - hookStartSeconds);
  const pct = cap ? Math.min(100, (shown / cap) * 100) : 0;

  if (blindLounge && !isBlindMediaRoute(mediaPath)) {
    return (
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-ink-900 sm:aspect-video">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={coverPath} alt="" className="h-full w-full object-cover opacity-60" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink-950/70 p-6 text-center">
          <p className="eyebrow">Blind cut</p>
          <p className="text-sm text-mist">This cut is not playable here. Blind plays uploaded audio only.</p>
        </div>
      </div>
    );
  }

  if (embed) {
    const tall = embed.kind === "tiktok" || embed.kind === "instagram";
    const audioEmbed = isAudioEmbed(embed.kind);
    const frameClass = audioEmbed
      ? embed.kind === "spotify"
        ? "h-[352px] w-full"
        : "h-[166px] w-full sm:h-[300px]"
      : "h-full w-full";
    const frameSrc = blind ? blindEmbedSrc(embed) : embed.src;
    return (
      <div
        className={`relative overflow-hidden bg-ink-900 ${
          audioEmbed ? "" : tall ? "aspect-[9/16] max-h-[70vh]" : "aspect-video"
        }`}
      >
        <iframe
          src={frameSrc}
          title={blind ? "Blind entry" : "Linked cut"}
          className={frameClass}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy={blind ? "no-referrer" : undefined}
        />
        {!blind && (
          <a
            href={embed.original.startsWith("http") ? embed.original : mediaPath || "#"}
            target="_blank"
            rel="noreferrer"
            className="absolute bottom-3 right-3 rounded-full bg-ink-950/80 px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-copper-200 hover:bg-ink-950"
          >
            Open link
          </a>
        )}
        {blind && (
          <p className="absolute bottom-3 left-3 rounded-full bg-ink-950/80 px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-paper/70">
            Entry - plays here
          </p>
        )}
      </div>
    );
  }

  // Short TikTok/share links (or any remote URL) that did not parse.
  const remote =
    mediaPath && (mediaPath.startsWith("http://") || mediaPath.startsWith("https://")) ? mediaPath : null;
  if (remote && !video) {
    if (blind) {
      return (
        <div className="relative overflow-hidden bg-ink-900 aspect-[9/16] max-h-[70vh] sm:aspect-video">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverPath} alt="" className="h-full w-full object-cover opacity-60" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink-950/70 p-6 text-center">
            <p className="eyebrow">Blind entry</p>
            <p className="text-sm text-mist">
              In-app preview is unavailable for this link. Opening the host site would reveal the creator, so it stays
              closed here. Judge from another Blind cut, or ask the artist to re-submit a YouTube / SoundCloud / Spotify
              / Audiomack / TikTok video link.
            </p>
          </div>
        </div>
      );
    }
    return (
      <div className="relative overflow-hidden bg-ink-900 aspect-[9/16] max-h-[70vh] sm:aspect-video">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={coverPath} alt="" className="h-full w-full object-cover opacity-60" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-ink-950/55 p-6 text-center">
          <p className="text-sm text-mist">Preview needs the original site. Tap to play there.</p>
          <a href={remote} target="_blank" rel="noreferrer" className="btn-copper">
            Play on linked site
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-ink-900">
      {video && mediaPath ? (
        <video
          ref={videoRef}
          src={mediaPath}
          poster={coverPath}
          playsInline
          className="aspect-video w-full object-cover"
          onTimeUpdate={(e) => onTime(e.currentTarget.currentTime)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />
      ) : (
        <div className="relative aspect-[4/5] w-full overflow-hidden sm:aspect-video">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverPath} alt="" className={`h-full w-full object-cover ${playing ? "kenburns" : ""}`} />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-transparent to-ink-950/20" />
          {mediaPath && (
            <audio
              ref={audioRef}
              src={mediaPath}
              preload={blindLounge ? "metadata" : undefined}
              controlsList="nodownload noplaybackrate"
              onContextMenu={(e) => e.preventDefault()}
              onTimeUpdate={(e) => onTime(e.currentTarget.currentTime)}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
            />
          )}
          {blindLounge && (
            <p className="absolute left-3 top-3 rounded-full bg-ink-950/80 px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-paper/70">
              Blind cut · plays here
            </p>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={() => (playing ? pause() : void start())}
        className="absolute inset-0 flex items-center justify-center"
        aria-label={playing ? "Pause" : "Play"}
      >
        {!playing && (
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-copper-400 text-ink-950 shadow-copper">
            <span className="ml-1 text-2xl">Play</span>
          </span>
        )}
      </button>
      <div className="absolute inset-x-0 bottom-0 p-4">
        <div className="h-0.5 bg-white/20">
          <div className="h-full bg-copper-400" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-paper/70">
          {formatDuration(shown)} / {formatDuration(cap)} preview
        </p>
      </div>
    </div>
  );
}
