"use client";

import { useState } from "react";
import {
  ARENA_PRICE_LABEL,
  MAX_AUDIO_SECONDS,
  MAX_VIDEO_SECONDS,
  PRICE,
  formatUsd,
  splitEntry,
  type Arena,
} from "@/lib/rules";

export default function EnterForm({
  remaining,
  stripeReady,
  chargesLive,
}: {
  remaining: Record<Arena, number>;
  stripeReady: boolean;
  chargesLive: boolean;
}) {
  const [arena, setArena] = useState<Arena>("blind");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const split = splitEntry(arena);
  const left = remaining[arena];
  const audio = arena !== "screen";

  function durationOf(file: File) {
    return new Promise<number>((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const el = document.createElement(audio ? "audio" : "video");
      el.preload = "metadata";
      el.onloadedmetadata = () => {
        const d = el.duration;
        URL.revokeObjectURL(url);
        resolve(Number.isFinite(d) ? d : 0);
      };
      el.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Could not read that file."));
      };
      el.src = url;
    });
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (left <= 0) {
      setError(
        arena === "blind"
          ? "Blind is one entry per 24 hours."
          : `You already used ${PRICE.tracks.maxPerDay} $5 submissions in the last 24 hours.`,
      );
      return;
    }
    const form = e.currentTarget;
    const data = new FormData(form);
    const file = data.get("media") as File | null;
    if (!file || !file.size) {
      setError("Add the audio or video file.");
      return;
    }
    try {
      const seconds = await durationOf(file);
      data.set("durationSeconds", String(Math.round(seconds)));
      if (!audio && seconds > MAX_VIDEO_SECONDS + 0.4) {
        setError("Videos must be under 2 minutes.");
        return;
      }
      if (audio && seconds > MAX_AUDIO_SECONDS + 0.4) {
        setError("Tracks must be under 10 minutes.");
        return;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read duration.");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/entries", { method: "POST", body: data });
    const json = await res.json();
    if (!res.ok) {
      setBusy(false);
      setError(json.error || "Could not enter.");
      return;
    }
    if (json.checkoutUrl) {
      window.location.href = json.checkoutUrl;
      return;
    }
    window.location.href = json.founding ? `/studio?founding=1` : `/studio?paid=1`;
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="mt-8 space-y-5">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {(["blind", "tracks", "screen"] as Arena[]).map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setArena(a)}
            className={arena === a ? "btn-copper !px-3" : "btn-ghost !px-3"}
          >
            {ARENA_PRICE_LABEL[a]}
          </button>
        ))}
      </div>
      <input type="hidden" name="arena" value={arena} />

      <div className="border border-white/10 p-4 text-sm text-mist">
        {!chargesLive ? (
          <>
            The cash pot is off while the board fills. Enter free. Same Keep / Pass rules. When the house opens the
            pot, Blind will be {formatUsd(splitEntry("blind").entryCents)} and tracks/videos{" "}
            {formatUsd(splitEntry("tracks").entryCents)} — this founding cut will not be charged.
          </>
        ) : arena === "blind" ? (
          <>
            Your name, page, and following stay off this board until the week closes. Strangers Keep or Pass the
            record. That is the only score that pays. House keeps {formatUsd(split.houseCents)}. Stripe about{" "}
            {formatUsd(split.feeCents)}. {formatUsd(split.potCents)} goes in the Blind pot.
          </>
        ) : (
          <>
            Named board — people can find you after they judge. Still ranked by Keep / Pass, not clicks. House keeps{" "}
            {formatUsd(split.houseCents)}. Stripe about {formatUsd(split.feeCents)}. {formatUsd(split.potCents)} goes
            in this pot.
          </>
        )}
      </div>

      <label className="block">
        <span className="eyebrow">Title</span>
        <input name="title" required maxLength={80} className="mt-2" placeholder="Title of the cut" />
      </label>
      <label className="block">
        <span className="eyebrow">Genre</span>
        <input
          name="genre"
          required
          maxLength={40}
          className="mt-2"
          placeholder={audio ? "R&B, rap, alt…" : "Drama, music video…"}
        />
      </label>
      {arena === "screen" && (
        <label className="block">
          <span className="eyebrow">Kind</span>
          <select name="screenKind" className="mt-2" defaultValue="music-video">
            <option value="music-video">Music video</option>
            <option value="series">Series teaser</option>
            <option value="short">Short film</option>
          </select>
        </label>
      )}
      <label className="block">
        <span className="eyebrow">One-line pitch {arena === "blind" ? "(hidden until week close)" : ""}</span>
        <textarea
          name="logline"
          required
          maxLength={160}
          rows={3}
          className="mt-2"
          placeholder="What should a stranger feel in the first seconds?"
        />
      </label>
      <label className="block">
        <span className="eyebrow">Cover still</span>
        <input name="cover" type="file" accept="image/jpeg,image/png,image/webp" className="mt-2" />
      </label>
      <label className="block">
        <span className="eyebrow">{audio ? "Audio (MP3, WAV, M4A)" : "Video under 2 minutes (MP4, WebM)"}</span>
        <input
          name="media"
          type="file"
          required
          accept={
            audio
              ? "audio/mpeg,audio/wav,audio/mp4,audio/x-m4a,.mp3,.wav,.m4a"
              : "video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
          }
          className="mt-2"
        />
      </label>
      {error && <p className="text-sm text-copper-300">{error}</p>}
      <button type="submit" disabled={busy || left <= 0} className="btn-copper w-full disabled:opacity-50">
        {busy
          ? "Sending…"
          : left <= 0
            ? "Limit reached"
            : !chargesLive
              ? "Enter free — pot is off"
              : stripeReady
                ? `Pay ${formatUsd(split.entryCents)} on Stripe`
                : `Enter ${formatUsd(split.entryCents)} (demo)`}
      </button>
      <p className="text-xs text-white/45">
        {arena === "blind"
          ? `${left} Blind entry left in this 24-hour window.`
          : `${left} of ${PRICE.tracks.maxPerDay} $5 entries left in this 24-hour window (tracks and videos share the cap).`}
        {!chargesLive
          ? " No charge until the house opens the pot."
          : stripeReady
            ? " Card or Cash App Pay."
            : " Stripe is not connected, so this would mark paid without a charge."}
      </p>
    </form>
  );
}
