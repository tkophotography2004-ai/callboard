"use client";

import { useEffect, useRef, useState } from "react";
import { isAudioEmbed, parseEmbed } from "@/lib/embed";
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
};

function isVideoPath(src: string | null) {
  if (!src) return false;
  return /\.(mp4|webm|mov)(\?|$)/i.test(src);
}

export default function MediaPlayer({
  coverPath,
  mediaPath,
  arena,
  durationSeconds,
  hookStartSeconds = 0,
  autoPlay,
  onPlay,
}: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const embed = parseEmbed(mediaPath);
  const video = isVideoPath(mediaPath);
  const cap = Math.min(durationSeconds || HOOK_SECONDS, arena === "film" || arena === "video" || arena === "creator" ? 120 : HOOK_SECONDS);

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

  if (embed) {
    const tall = embed.kind === "tiktok" || embed.kind === "instagram";
    const audioEmbed = isAudioEmbed(embed.kind);
    const frameClass = audioEmbed
      ? embed.kind === "spotify"
        ? "h-[352px] w-full"
        : "h-[166px] w-full sm:h-[300px]"
      : "h-full w-full";
    return (
      <div
        className={`relative overflow-hidden bg-ink-900 ${
          audioEmbed ? "" : tall ? "aspect-[9/16] max-h-[70vh]" : "aspect-video"
        }`}
      >
        <iframe
          src={embed.src}
          title="Linked cut"
          className={frameClass}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
        <a
          href={embed.original.startsWith("http") ? embed.original : mediaPath || "#"}
          target="_blank"
          rel="noreferrer"
          className="absolute bottom-3 right-3 rounded-full bg-ink-950/80 px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-copper-200 hover:bg-ink-950"
        >
          Open link
        </a>
      </div>
    );
  }

  // Short TikTok/share links (or any remote URL) that did not parse: never hide the cut.
  const remote =
    mediaPath &&
    (mediaPath.startsWith("http://") || mediaPath.startsWith("https://"))
      ? mediaPath
      : null;
  if (remote && !video) {
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
          {mediaPath && <audio ref={audioRef} src={mediaPath} onTimeUpdate={(e) => onTime(e.currentTarget.currentTime)} />}
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
            <span className="ml-1 text-2xl">▶</span>
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
