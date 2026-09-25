"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import MediaPlayer from "./MediaPlayer";
import type { Arena } from "@/lib/rules";
import { ARENA_LABEL, SCREEN_KIND_LABEL } from "@/lib/rules";

type Blind = {
  id: string;
  arena: Arena;
  screenKind: "series" | "music-video" | "short" | null;
  genre: string;
  coverPath: string;
  mediaPath: string | null;
  durationSeconds: number;
  hookStartSeconds: number;
  remaining: number;
};

type Reveal = {
  keep: boolean;
  title: string;
  artist: string;
  slug: string;
  keepPct: number;
  sample: number;
};

export default function JudgeClient({ arena, signedIn = false }: { arena: Arena; signedIn?: boolean }) {
  const [card, setCard] = useState<Blind | null>(null);
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [busy, setBusy] = useState(false);
  const [empty, setEmpty] = useState("");
  const [judged, setJudged] = useState(0);

  const load = useCallback(async () => {
    setBusy(true);
    setReveal(null);
    const res = await fetch(`/api/judge/next?arena=${arena}`, { cache: "no-store" });
    const data = await res.json();
    setBusy(false);
    if (data.error) {
      setCard(null);
      setEmpty(data.error);
      return;
    }
    setEmpty("");
    setCard(data.entry);
  }, [arena]);

  useEffect(() => {
    void load();
  }, [load]);

  async function vote(keep: boolean) {
    if (!card || busy) return;
    setBusy(true);
    const res = await fetch("/api/judge/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entryId: card.id, keep }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.error) {
      setEmpty(data.error);
      return;
    }
    setReveal(data);
    setJudged((n) => n + 1);
  }

  return (
    <div className="mx-auto max-w-xl px-4 pb-10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="eyebrow">{ARENA_LABEL[arena]}</p>
          <h1 className="display mt-2 text-4xl">{arena === "blind" ? "Blind cut" : "Instant cut"}</h1>
        </div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-mist">{judged} judged</p>
      </div>
      <p className="mt-3 text-sm text-mist">
        {arena === "blind"
          ? "Music only. The artist stays hidden — only crowned winners are revealed. Keep means you would leave it on. Pass means skip."
          : "Name is hidden while you listen. Keep or Pass is the only score that pays — not plays, not shares."}{" "}
        {signedIn
          ? "This vote counts toward the fan pot."
          : "Sign in so this vote can earn you a cut of the fan pot."}
      </p>

      {empty && (
        <div className="mt-8 border border-white/10 p-6 text-mist">
          <p>{empty}</p>
          <Link href={`/board/${arena}`} className="btn-ghost mt-5">
            See the board
          </Link>
        </div>
      )}

      {card && !reveal && (
        <div className="mt-6 overflow-hidden border border-white/10">
          <p className="px-4 py-3 text-[11px] uppercase tracking-[0.22em] text-copper-300">
            {card.screenKind ? SCREEN_KIND_LABEL[card.screenKind] : card.arena === "blind" ? "Entry" : "Music"} - {card.genre}
          </p>
          <MediaPlayer
            key={card.id}
            coverPath={card.coverPath}
            mediaPath={card.mediaPath}
            arena={card.arena}
            durationSeconds={card.durationSeconds}
            hookStartSeconds={card.hookStartSeconds}
            autoPlay
            anonymous={arena === "blind"}
          />
          <div className="grid grid-cols-2">
            <button type="button" disabled={busy} onClick={() => vote(false)} className="btn-pass py-5">
              Pass
            </button>
            <button type="button" disabled={busy} onClick={() => vote(true)} className="btn-copper py-5">
              Keep
            </button>
          </div>
        </div>
      )}

      {reveal && (
        <div className="mt-6 border border-copper-400/30 bg-ink-900 p-6">
          <p className="eyebrow">{reveal.keep ? "You kept it" : "You passed"}</p>
          <h2 className="display mt-2 text-3xl">{reveal.title}</h2>
          <p className="mt-1 text-mist">{reveal.artist}</p>
          <p className="mt-4 text-sm text-mist">
            {Math.round(reveal.keepPct * 100)}% keep · {reveal.sample} scouts
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={() => void load()} className="btn-copper">
              Next cut
            </button>
            <Link href={`/e/${reveal.slug}`} className="btn-ghost">
              Open entry
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
