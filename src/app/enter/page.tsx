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
        <p className="mt-4 text-mist">Paste a link. Strangers Keep or Pass. Clicks do not buy first place.</p>

        <div className="mt-8 space-y-3">
          <div className="border border-white/10 p-4">
            <p className="text-paper">Blind — $30</p>
            <p className="mt-2 text-sm text-mist">
              Music only · name hidden · YouTube, SoundCloud, Spotify, Audiomack, TikTok
            </p>
          </div>
          <div className="border border-white/10 p-4">
            <p className="text-paper">Track · Film · Music Video · Creator</p>
            <p className="mt-2 text-sm text-mist">
              $5 launch ($10 regular) · named · Track adds Instagram · Film / Video / Creator: YouTube, TikTok,
              Instagram, Vimeo
            </p>
          </div>
          <div className="border border-white/10 p-4">
            <p className="text-paper">Keep / Pass ranks the work</p>
            <p className="mt-2 text-sm text-mist">Valid email required · Cash App / PayPal optional in Studio</p>
          </div>
        </div>

        <div className="mt-10 flex gap-3">
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
          ? "Choose a lounge, paste your link, and go. Keep / Pass ranks the work — not clicks."
          : "The cash pot is off while the board fills. Enter free. Same Keep / Pass rules."}
      </p>

      <div className="mt-6 space-y-3">
        <div className="border border-white/10 p-4 text-sm text-mist">
          <span className="text-paper">Blind $30</span> — music · one per 24h · YouTube, SoundCloud, Spotify,
          Audiomack, TikTok
        </div>
        <div className="border border-white/10 p-4 text-sm text-mist">
          <span className="text-paper">Named lounges $5 launch</span> — Track, Film, Music Video, Creator · three per
          24h · {potCapLine()}
        </div>
      </div>

      {(user.freePasses || 0) > 0 && (
        <p className="mt-4 border border-copper-400/40 p-4 text-sm">
          You have {user.freePasses} free {user.freePasses === 1 ? "pass" : "passes"}. Check the box on the form, or
          paste your SC- code, to enter without paying.
        </p>
      )}
      {!hasPayout && (
        <p className="mt-4 border border-white/15 p-4 text-sm text-mist">
          Tip: add Cash App or PayPal in{" "}
          <Link href="/studio" className="text-copper-300">
            Studio
          </Link>{" "}
          so Tina can pay you if you place. Not required to enter.
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
