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
    const ms = Math.max(15, Math.min(current.durationSeconds || 45, 600)) * 1000;
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
      <section className="mx-auto max-w-6xl px-4 py-6">
        <div className="border border-white/10 bg-black/40 p-6 sm:p-8">
          <p className="eyebrow">Music player · this week</p>
          <h2 className="display mt-2 text-3xl sm:text-4xl">Nothing queued yet</h2>
          <p className="mt-3 max-w-xl text-sm text-mist">
            No playable Music Lounge entries this week. Submit a YouTube, SoundCloud, Spotify, or Audiomack link
            and it will show up here.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/enter" className="btn-copper">
              Submit
            </Link>
            <Link href="/board/tracks" className="btn-ghost">
              Music board
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const embed = current ? parseEmbed(current.mediaPath) : null;
  const showEmbed = Boolean(current && embed && playing && playIntent);
  const fileVideo = current?.kind === "file" && isVideoFile(current.mediaPath);

  return (
    <section className="mx-auto max-w-6xl px-4 py-6">
      <div className="border border-copper-400/30 bg-black/40 p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Music player · this week</p>
            <h2 className="display mt-2 text-3xl sm:text-4xl">Listen in</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/board/tracks" className="btn-ghost !px-3 !py-2 text-[11px]">
              Music
            </Link>
            <Link href="/enter" className="btn-ghost !px-3 !py-2 text-[11px]">
              Submit
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div>
            <div className="relative overflow-hidden border border-white/10 bg-ink-900">
              {showEmbed && embed ? (
                <iframe
                  key={`${current!.id}-play`}
                  src={embedPlaybackSrc(embed, true)}
                  title={current!.title}
                  className={
                    embed.kind === "spotify"
                      ? "h-[352px] w-full"
                      : "h-[166px] w-full sm:h-[300px]"
                  }
                  // Intentionally no autoplay attribute on the iframe element.
                  // Autoplay only via platform query after user Play (playIntent).
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : fileVideo && current && playing && playIntent ? (
                <video
                  ref={videoRef}
                  key={current.id}
                  src={current.mediaPath}
                  playsInline
                  className="aspect-video w-full object-cover"
                  onEnded={() => {
                    if (playIntent && tracks.length > 1) {
                      setIndex((i) => (i + 1) % tracks.length);
                      setPlaying(true);
                    } else {
                      setPlaying(false);
                    }
                  }}
                />
              ) : (
                <div className="relative aspect-[16/9] w-full sm:aspect-[2/1]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={current!.coverPath}
                    alt=""
                    className={`h-full w-full object-cover ${playing ? "kenburns" : ""}`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/20 to-ink-950/40" />
                  {current?.kind === "file" && !fileVideo && (
                    <audio
                      ref={audioRef}
                      key={current.id}
                      src={current.mediaPath}
                      onEnded={() => {
                        if (playIntent && tracks.length > 1) {
                          setIndex((i) => (i + 1) % tracks.length);
                          setPlaying(true);
                        } else {
                          setPlaying(false);
                        }
                      }}
                    />
                  )}
                </div>
              )}
            </div>

            <div className="mt-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-copper-300">Now playing</p>
              <p className="display mt-1 text-2xl sm:text-3xl">{current!.title}</p>
              <p className="mt-1 text-sm text-mist">
                {current!.artist}
                {current!.durationSeconds ? ` · ${formatDuration(current!.durationSeconds)}` : ""}
                {current!.kind !== "file" ? ` · ${current!.kind}` : ""}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button type="button" onClick={prev} className="btn-ghost !px-4" aria-label="Previous">
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => (playing ? pause() : play())}
                  className="btn-copper min-w-[7rem]"
                  aria-label={playing ? "Pause" : "Play"}
                >
                  {playing ? "Pause" : "Play"}
                </button>
                <button type="button" onClick={next} className="btn-ghost !px-4" aria-label="Next">
                  Next
                </button>
                <Link href={`/e/${current!.slug}`} className="btn-ghost !px-4 text-[11px]">
                  Open entry
                </Link>
              </div>
              <p className="mt-3 text-[11px] text-white/40">
                Silent until you press Play. After that, tracks can advance when one ends.
              </p>
            </div>
          </div>

          <div>
            <p className="eyebrow">Up next</p>
            <ul className="mt-3 max-h-[22rem] space-y-2 overflow-y-auto pr-1">
              {upNext.length === 0 ? (
                <li className="border border-white/10 p-3 text-sm text-mist">Only one track this week.</li>
              ) : (
                upNext.map((t, i) => (
                  <li key={`${t.id}-${i}`}>
                    <button
                      type="button"
                      onClick={() => {
                        const real = tracks.findIndex((x) => x.id === t.id);
                        if (real >= 0) goTo(real, playIntent && playing);
                      }}
                      className="flex w-full gap-3 border border-white/10 p-3 text-left hover:border-copper-400/40"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={t.coverPath} alt="" className="h-12 w-12 shrink-0 object-cover" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-paper">{t.title}</span>
                        <span className="block truncate text-[11px] uppercase tracking-[0.14em] text-white/40">
                          {t.artist}
                        </span>
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
