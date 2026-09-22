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
          Link only for now: music on YouTube, SoundCloud, Spotify, or Audiomack; video on YouTube, TikTok, Instagram,
          or Vimeo. Keep / Pass ranks the work, not clicks. Valid email and a Cash App cashtag required so winnings can
          be sent.
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
  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <p className="eyebrow">{user.cashtag}</p>
      <h1 className="display mt-3 text-5xl">Put it on the board</h1>
      <p className="mt-4 text-mist">
        {store.chargesLive
          ? `Blind is $30 — music tracks only, one per 24 hours. Track, Film, Music Video, and Creator lounges are $5 for launch (regular $10 a submission), three per 24 hours. Link only — no file uploads until the house buys storage. Keep / Pass ranks the work. ${potCapLine()} The week closes Sunday. Cash App payouts are sent within 10 days of the crown.`
          : "The cash pot is off while the board fills. Enter free. Same judging. When the house opens the pot, new Blind entries will be $30 and the $5 lounges open."}
      </p>
      {(user.freePasses || 0) > 0 && (
        <p className="mt-4 border border-copper-400/40 p-4 text-sm">
          You have {user.freePasses} free {user.freePasses === 1 ? "pass" : "passes"}. Check the box on the form to
          enter without paying.
        </p>
      )}
      {!user.cashtag && (
        <p className="mt-4 border border-copper-400/40 p-4 text-sm">
          Add a Cash App cashtag in <Link href="/studio" className="text-copper-300">Studio</Link> before you can be
          paid.
        </p>
      )}
      <EnterForm
        remaining={user.cashtag ? remaining : { blind: 0, tracks: 0, film: 0, video: 0, creator: 0 }}
        stripeReady={stripeEnabled()}
        chargesLive={Boolean(store.chargesLive)}
        freePasses={user.freePasses || 0}
      />
    </div>
  );
}
