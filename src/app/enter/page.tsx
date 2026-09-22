import Link from "next/link";
import EnterForm from "@/components/EnterForm";
import { getSessionUser } from "@/lib/auth";
import { remainingToday } from "@/lib/queries";
import { potCapLine } from "@/lib/rules";
import { stripeEnabled } from "@/lib/stripe";
import { readStore } from "@/lib/store";

export const metadata = { title: "Enter" };

export default async function EnterPage() {
  const user = await getSessionUser();
  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <p className="eyebrow">Two ways in</p>
        <h1 className="display mt-3 text-5xl">Enter the board</h1>
        <p className="mt-4 text-mist">
          Blind is $30 and music only — name hidden. Track, Film, Music Video, and Creator lounges are $5 for launch
          (regular price is $10 a submission) and named.
          Link only for now: Blind — YouTube, SoundCloud, Spotify, Audiomack, or TikTok; Track — those plus Instagram;
          Film / Music Video / Creator — YouTube, TikTok, Instagram, or Vimeo. Keep / Pass ranks the work, not clicks.
          Valid email required. Cash App or PayPal optional — add in Studio anytime so you are ready when the pot opens.
        </p>
        <div className="mt-8 flex gap-3">
          <Link href="/signup?next=/enter" className="btn-copper">
            Create account
          </Link>
          <Link href="/login?next=/enter" className="btn-ghost">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  const store = await readStore();
  const remaining = {
    blind: remainingToday(store, user.id, "blind"),
    tracks: remainingToday(store, user.id, "tracks"),
    film: remainingToday(store, user.id, "film"),
    video: remainingToday(store, user.id, "video"),
    creator: remainingToday(store, user.id, "creator"),
  };
  const hasPayout = Boolean(user.cashtag || user.paypalEmail);
  const payoutLabel =
    [user.cashtag, user.paypalEmail ? `PayPal ${user.paypalEmail}` : ""].filter(Boolean).join(" · ") ||
    "payout optional";

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <p className="eyebrow">{payoutLabel}</p>
      <h1 className="display mt-3 text-5xl">Put it on the board</h1>
      <p className="mt-4 text-mist">
        {store.chargesLive
          ? `Blind is $30 — music tracks (YouTube, SoundCloud, Spotify, Audiomack, or TikTok), one per 24 hours. Track, Film, Music Video, and Creator lounges are $5 for launch (regular $10 a submission), three per 24 hours. Track also allows Instagram. Film / Music Video / Creator: YouTube, TikTok, Instagram, or Vimeo. Keep / Pass ranks the work. ${potCapLine()} The week closes Sunday. Cash App or PayPal payouts are sent within 10 days of the crown.`
          : "The cash pot is off while the board fills. Enter free. Same judging. When the house opens the pot, new Blind entries will be $30 and the $5 lounges open."}
      </p>
      {(user.freePasses || 0) > 0 && (
        <p className="mt-4 border border-copper-400/40 p-4 text-sm">
          You have {user.freePasses} free {user.freePasses === 1 ? "pass" : "passes"}. Check the box on the form to
          enter without paying.
        </p>
      )}
      {!hasPayout && (
        <p className="mt-4 border border-white/15 p-4 text-sm text-mist">
          Tip: add Cash App or PayPal in <Link href="/studio" className="text-copper-300">Studio</Link> so Tina can
          pay you if you place. Not required to enter.
        </p>
      )}
      <EnterForm
        remaining={remaining}
        stripeReady={stripeEnabled()}
        chargesLive={Boolean(store.chargesLive)}
        freePasses={user.freePasses || 0}
      />
    </div>
  );
}
