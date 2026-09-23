"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { embedPlaybackSrc, parseEmbed, type HomeMusicKind } from "@/lib/embed";
import { formatDuration } from "@/lib/format";

export type HomeMusicTrack = {
  id: string;
  slug: string;
  title: string;
  artist: string;
  coverPath: string;
  mediaPath: string;
  durationSeconds: number;
  kind: HomeMusicKind;
};

type Props = {
  tracks: HomeMusicTrack[];
};

function isVideoFile(src: string) {
  return /\.(mp4|webm|mov)(\?|$)/i.test(src);
}

export default function HomeMusicPlayer({ tracks }: Props) {
  const [index, setIndex] = useState(0);
  /** User pressed Play this session — required before any sound / auto-advance. */
  const [playIntent, setPlayIntent] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const current = tracks[index] || null;
  const upNext = useMemo(() => {
    if (!tracks.length) return [];
    const out: HomeMusicTrack[] = [];
    for (let i = 1; i <= Math.min(5, tracks.length - 1); i++) {
      out.push(tracks[(index + i) % tracks.length]);
    }
    return out;
  }, [tracks, index]);

  const clearAdvance = useCallback(() => {
    if (advanceTimer.current) {
      clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
  }, []);

  const goTo = useCallback(
    (nextIndex: number, startPlayback: boolean) => {
      if (!tracks.length) return;
      const n = ((nextIndex % tracks.length) + tracks.length) % tracks.length;
      setIndex(n);
      if (startPlayback && playIntent) {
        setPlaying(true);
      } else if (!startPlayback) {
        setPlaying(false);
      }
    },
    [tracks.length, playIntent],
  );

  const play = useCallback(() => {
    setPlayIntent(true);
    setPlaying(true);
  }, []);

  const pause = useCallback(() => {
    setPlaying(false);
    audioRef.current?.pause();
    videoRef.current?.pause();
    clearAdvance();
  }, [clearAdvance]);

  const next = useCallback(() => {
    goTo(index + 1, playIntent && playing);
  }, [goTo, index, playIntent, playing]);

  const prev = useCallback(() => {
    goTo(index - 1, playIntent && playing);
  }, [goTo, index, playIntent, playing]);

  // Native file playback
  useEffect(() => {
    if (!current || current.kind !== "file") return;
    const el = isVideoFile(current.mediaPath) ? videoRef.current : audioRef.current;
    if (!el) return;
    if (playing && playIntent) {
      el.currentTime = 0;
      void el.play().catch(() => setPlaying(false));
    } else {
      el.pause();
    }
  }, [current, playing, playIntent, index]);

  // Approximate auto-advance for embeds (no reliable ended event across platforms)
  useEffect(() => {
    clearAdvance();
    if (!current || !playing || !playIntent) return;
    if (current.kind === "file") return; // use onEnded
    // Unknown/short metadata must not cut an embed off at an arbitrary preview length.
    // Let the platform player run until its real end; only timed-advance known full tracks.
    const durationSeconds = Number(current.durationSeconds);
    if (!Number.isFinite(durationSeconds) || durationSeconds < 60) return;
    const ms = Math.min(durationSeconds, 20 * 60) * 1000;
    advanceTimer.current = setTimeout(() => {
      if (tracks.length <= 1) {
        setPlaying(false);
        return;
      }
      setIndex((i) => (i + 1) % tracks.length);
      setPlaying(true);
    }, ms);
    return clearAdvance;
  }, [current, playing, playIntent, tracks.length, clearAdvance, index]);

  if (!tracks.length) {
    return (
      <section className="border-b border-white/10 bg-ink-950/90" aria-label="Music lounge player">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2.5 text-sm text-mist">
          <span className="display text-base text-copper-300" aria-hidden>
            ♪
          </span>
          <span className="min-w-0 flex-1 truncate">No Music queued</span>
          <Link href="/enter" className="shrink-0 text-[11px] uppercase tracking-[0.16em] text-copper-300 hover:text-copper-200">
            Submit
          </Link>
          <Link href="/board/tracks" className="hidden shrink-0 text-[11px] uppercase tracking-[0.16em] text-white/45 hover:text-copper-200 sm:inline">
            Music
          </Link>
        </div>
      </section>
    );
  }

  const embed = current ? parseEmbed(current.mediaPath) : null;
  const showEmbed = Boolean(current && embed && playing && playIntent);
  const fileVideo = current?.kind === "file" && isVideoFile(current.mediaPath);
  const nextTitle = upNext[0]?.title;

  return (
    <section className="border-b border-copper-400/25 bg-ink-950/95" aria-label="Music lounge player">
      <div className="mx-auto max-w-6xl px-4 py-2">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current!.coverPath}
            alt=""
            className="h-10 w-10 shrink-0 object-cover border border-white/10 sm:h-11 sm:w-11"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.18em] text-copper-300">Music · now playing</p>
            <p className="truncate text-sm text-paper sm:text-[15px]">{current!.title}</p>
            <p className="truncate text-[11px] text-mist">
              {current!.artist}
              {current!.durationSeconds ? ` · ${formatDuration(current!.durationSeconds)}` : ""}
              {nextTitle ? ` · Up next: ${nextTitle}` : ""}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
            <button type="button" onClick={prev} className="btn-ghost !px-2.5 !py-1.5 text-[11px]" aria-label="Previous">
              Prev
            </button>
            <button
              type="button"
              onClick={() => (playing ? pause() : play())}
              className="btn-copper !px-3 !py-1.5 min-w-[4.25rem] text-[11px]"
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? "Pause" : "Play"}
            </button>
            <button type="button" onClick={next} className="btn-ghost !px-2.5 !py-1.5 text-[11px]" aria-label="Next">
              Next
            </button>
            <button
              type="button"
              onClick={() => setShowQueue((v) => !v)}
              className="btn-ghost !px-2.5 !py-1.5 text-[11px]"
              aria-expanded={showQueue}
              aria-label="Up next"
            >
              Queue
            </button>
            <Link href={`/e/${current!.slug}`} className="btn-ghost !px-2.5 !py-1.5 text-[11px] hidden md:inline">
              Open
            </Link>
          </div>
        </div>

        {showQueue && (
          <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto border-t border-white/10 pt-2">
            {upNext.length === 0 ? (
              <li className="px-1 py-1 text-xs text-mist">Only one track this week.</li>
            ) : (
              upNext.map((t, i) => (
                <li key={`${t.id}-${i}`}>
                  <button
                    type="button"
                    onClick={() => {
                      const real = tracks.findIndex((x) => x.id === t.id);
                      if (real >= 0) goTo(real, playIntent && playing);
                    }}
                    className="flex w-full items-center gap-2 px-1 py-1.5 text-left hover:bg-white/[0.03]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={t.coverPath} alt="" className="h-8 w-8 shrink-0 object-cover" />
                    <span className="min-w-0 flex-1 truncate text-xs text-paper">{t.title}</span>
                    <span className="hidden max-w-[8rem] truncate text-[10px] uppercase tracking-[0.12em] text-white/40 sm:inline">
                      {t.artist}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        )}

        {/* Compact stage: only when actively playing embeds / file video */}
        {showEmbed && embed ? (
          <div className="mt-2 overflow-hidden border border-white/10 bg-ink-900">
            <iframe
              key={`${current!.id}-play`}
              src={embedPlaybackSrc(embed, true)}
              title={current!.title}
              className={
                embed.kind === "spotify"
                  ? "h-[152px] w-full"
                  : embed.kind === "soundcloud" || embed.kind === "audiomack"
                    ? "h-[120px] w-full sm:h-[166px]"
                    : "aspect-video max-h-[220px] w-full"
              }
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        ) : fileVideo && current && playing && playIntent ? (
          <div className="mt-2 overflow-hidden border border-white/10 bg-ink-900">
            <video
              ref={videoRef}
              key={current.id}
              src={current.mediaPath}
              playsInline
              className="aspect-video max-h-[220px] w-full object-cover"
              onEnded={() => {
                if (playIntent && tracks.length > 1) {
                  setIndex((i) => (i + 1) % tracks.length);
                  setPlaying(true);
                } else {
                  setPlaying(false);
                }
              }}
            />
          </div>
        ) : current?.kind === "file" && !fileVideo ? (
          <audio
            ref={audioRef}
            key={current.id}
            src={current.mediaPath}
            className="hidden"
            onEnded={() => {
              if (playIntent && tracks.length > 1) {
                setIndex((i) => (i + 1) % tracks.length);
                setPlaying(true);
              } else {
                setPlaying(false);
              }
            }}
          />
        ) : null}
      </div>
    </section>
  );
}
