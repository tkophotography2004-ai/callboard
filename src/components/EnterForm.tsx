"use client";

import { useEffect, useState } from "react";
import FreePassFields from "@/components/FreePassFields";
import { linkHelp } from "@/lib/embed";
import { COVER_ACCEPT, COVER_MAX_BYTES, validateCoverFile } from "@/lib/cover";
import {
  ARENAS,
  arenaPriceLabel,
  BRIUNKA_EMAIL,
  BRIUNKA_IP_LINE,
  LINK_ONLY_LINE,
  freeWeekEndLabel,
  PRICE,
  formatUsd,
  potCapLine,
  isAudioLounge,
  loungeRequiresPayment,
  splitEntry,
  submissionsAreFree,
  type Arena,
} from "@/lib/rules";

export default function EnterForm({
  remaining,
  stripeReady,
  chargesLive,
  freePasses = 0,
}: {
  remaining: Record<Arena, number>;
  stripeReady: boolean;
  chargesLive: boolean;
  freePasses?: number;
}) {
  const [arena, setArena] = useState<Arena>("blind");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverName, setCoverName] = useState("");
  const split = splitEntry(arena);
  const left = remaining[arena];
  const audio = isAudioLounge(arena);
  const mustPay = loungeRequiresPayment(arena, chargesLive);

  useEffect(() => {
    return () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
    };
  }, [coverPreview]);

  function onCoverChange(file: File | null) {
    setError("");
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    if (!file) {
      setCoverPreview(null);
      setCoverName("");
      return;
    }
    const bad = validateCoverFile(file);
    if (bad) {
      setError(bad);
      setCoverPreview(null);
      setCoverName("");
      return;
    }
    setCoverName(file.name);
    setCoverPreview(URL.createObjectURL(file));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (left <= 0) {
      setError(
        arena === "blind"
          ? "Blind is one entry per 24 hours."
          : `You already used ${PRICE[arena].maxPerDay} entries in this lounge in the last 24 hours.`,
      );
      return;
    }
    const form = e.currentTarget;
    const data = new FormData(form);
    const sourceUrl = String(data.get("sourceUrl") || "").trim();
    if (!sourceUrl) {
      setError(linkHelp(arena));
      return;
    }
    const cover = data.get("cover");
    if (cover instanceof File && cover.size > 0) {
      const bad = validateCoverFile(cover);
      if (bad) {
        setError(bad);
        return;
      }
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
    const q = new URLSearchParams();
    if (json.slug) q.set("slug", String(json.slug));
    q.set("arena", arena);
    const title = String(data.get("title") || "").trim();
    if (title) q.set("title", title);
    if (json.passCode) q.set("code", String(json.passCode));
    if (json.awardedPass) q.set("pass", "1");
    if (json.pass) q.set("usedpass", "1");
    if (json.beta) q.set("beta", "1");
    if (json.founding) q.set("founding", "1");
    if (!json.beta && !json.founding && !json.pass && !json.awardedPass) q.set("paid", "1");
    window.location.href = `/success?${q.toString()}`;
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="mt-8 space-y-5">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {ARENAS.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setArena(a)}
            className={arena === a ? "btn-copper !px-3" : "btn-ghost !px-3"}
          >
            {arenaPriceLabel(a)}
          </button>
        ))}
      </div>
      <input type="hidden" name="arena" value={arena} />

      <div className="border border-white/10 p-4 text-sm text-mist">
        {!chargesLive ? (
          <>
            The cash pot is off while the board fills. Submit free. Same Keep / Pass rules. When the house opens the
            pot, Blind will be $30 and named lounges resume normal pricing — this founding cut will not be charged.
          </>
        ) : submissionsAreFree() ? (
          <>
            Free submissions through {freeWeekEndLabel()} — platform make-good after recent errors. Paste your link,
            Keep / Pass ranks the work. No Stripe charge this window. After that, Blind returns to $30 and named
            lounges resume normal paid entry.{" "}
            {arena === "blind" ? "One Blind entry per 24 hours." : "Three entries per 24 hours."} {potCapLine()}
          </>
        ) : arena === "blind" ? (
          <>
            Music artists only. Paste a YouTube, SoundCloud, Spotify, Audiomack, or TikTok link. Your name, page, and following
            stay off this board until the week closes. Strangers Keep or Pass the record. One Blind entry per 24 hours.{" "}
            {potCapLine()}
          </>
        ) : arena === "creator" ? (
          <>
            Creator Lounge — for people who already pay to promote on social. Paste the TikTok, Instagram, YouTube, or
            Vimeo you boosted. Keep / Pass ranks it. Three entries per 24 hours. $5 for launch, regular $10 a
            submission. {potCapLine()}
          </>
        ) : arena === "tracks" ? (
          <>
            Named lounge. Paste a YouTube, SoundCloud, Spotify, Audiomack, TikTok, or Instagram link. Keep / Pass ranks
            the work, not clicks. Three entries per 24 hours. $5 for launch, regular $10 a submission. {potCapLine()}
          </>
        ) : (
          <>
            Named lounge. Paste a YouTube, TikTok, Instagram, or Vimeo link. Keep / Pass ranks the work, not clicks.
            Three entries per 24 hours. $5 for launch, regular $10 a submission. {potCapLine()}
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
          placeholder={arena === "blind" ? "R&B, rap, alt…" : audio ? "Genre" : "Drama, music video…"}
        />
      </label>

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
      <div className="border border-white/10 p-4">
        <p className="eyebrow">Your links — hidden until you win</p>
        <p className="mt-2 text-xs text-white/45">
          Instagram, TikTok, Facebook, YouTube, Spotify, Apple Music. Nobody sees these until you land in the top 3.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input name="instagram" placeholder="Instagram" />
          <input name="tiktok" placeholder="TikTok" />
          <input name="facebook" placeholder="Facebook" />
          <input name="youtube" placeholder="YouTube" />
          <input name="spotify" placeholder="Spotify" />
          <input name="appleMusic" placeholder="Apple Music" />
          <input name="other" placeholder="Other link" />
        </div>
      </div>
      {arena === "film" && (
        <div className="border border-copper-400/40 p-4 text-sm text-paper">
          {BRIUNKA_IP_LINE}{" "}
          <a href={`mailto:${BRIUNKA_EMAIL}`} className="text-copper-300">
            {BRIUNKA_EMAIL}
          </a>
        </div>
      )}
      <label className="block">
        <span className="eyebrow">
          {arena === "blind"
            ? "Link your track · YouTube, SoundCloud, Spotify, Audiomack, TikTok"
            : arena === "tracks"
              ? "Link your track · YouTube, SoundCloud, Spotify, Audiomack, TikTok, Instagram"
              : "Link your video · YouTube, TikTok, Instagram, Vimeo"}
        </span>
        <input
          name="sourceUrl"
          required
          className="mt-2"
          placeholder={
            arena === "blind" || arena === "tracks"
              ? "https://soundcloud.com/you/track · youtube.com · tiktok.com/…"
              : "https://www.tiktok.com/@you/video/… or youtube.com/watch?v=…"
          }
        />
        <span className="mt-1 block text-xs text-white/45">
          {linkHelp(arena)} It plays on Scroll Call®.
          {arena !== "blind" && arena !== "tracks"
            ? " YouTube, TikTok, and Vimeo play best. Instagram may ask viewers to open the app."
            : arena === "tracks"
              ? " Instagram may ask viewers to open the app."
              : ""}
        </span>
      </label>
      <div className="border border-white/10 p-4">
        <label className="block">
          <span className="eyebrow">Cover art (optional)</span>
          <input
            name="cover"
            type="file"
            accept={COVER_ACCEPT}
            className="mt-2 block w-full text-sm text-mist file:mr-3 file:border file:border-white/20 file:bg-transparent file:px-3 file:py-1.5 file:text-[11px] file:uppercase file:tracking-[0.16em] file:text-copper-300"
            onChange={(e) => onCoverChange(e.target.files?.[0] || null)}
          />
        </label>
        <p className="mt-2 text-xs text-white/45">
          JPEG, PNG, or WebP · max {Math.round(COVER_MAX_BYTES / (1024 * 1024))}MB. Shown on the board, entry page, and Music
          player. Leave blank to use the default art.
          {arena === "blind" ? " Blind: image is fine — keep your identity out of the title and pitch." : ""}
        </p>
        {coverPreview && (
          <div className="mt-3 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverPreview} alt="" className="h-16 w-16 object-cover border border-white/10" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-paper">{coverName}</p>
              <button
                type="button"
                className="mt-1 text-[11px] uppercase tracking-[0.16em] text-copper-300"
                onClick={() => {
                  const input = document.querySelector<HTMLInputElement>('input[name="cover"]');
                  if (input) input.value = "";
                  onCoverChange(null);
                }}
              >
                Remove
              </button>
            </div>
          </div>
        )}
      </div>
      <FreePassFields freePasses={freePasses} mustPay={mustPay} />
      <p className="text-xs text-white/45">{LINK_ONLY_LINE}</p>
      {error && <p className="text-sm text-copper-300">{error}</p>}
      <button type="submit" disabled={busy || left <= 0} className="btn-copper w-full disabled:opacity-50">
        {busy
          ? "Sending…"
          : left <= 0
            ? "Limit reached"
            : !chargesLive
              ? "Submit free — pot is off"
              : !mustPay
                ? submissionsAreFree()
                  ? `Submit free — through ${freeWeekEndLabel()}`
                  : "Submit free — beta"
                : stripeReady
                    ? `Pay ${formatUsd(split.entryCents)} on Stripe`
                    : `Submit ${formatUsd(split.entryCents)} (demo)`}
      </button>
      <p className="text-xs text-white/45">
        {arena === "blind"
          ? `${left} Blind entry left in this 24-hour window.`
          : `${left} of ${PRICE[arena].maxPerDay} entries left in this lounge today.`}
        {!mustPay
          ? submissionsAreFree()
            ? ` No charge through ${freeWeekEndLabel()}. Paid entry resumes after.`
            : arena === "blind"
              ? " No charge until the house opens the pot."
              : " No charge during beta. Share the link with your fans after you submit."
          : stripeReady
            ? " Card or Cash App Pay."
            : " Stripe is not connected, so this would mark paid without a charge."}
      </p>
    </form>
  );
}
