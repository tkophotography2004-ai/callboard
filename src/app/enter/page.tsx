import Link from "next/link";
import EnterForm from "@/components/EnterForm";
import { getSessionUser } from "@/lib/auth";
import { remainingToday } from "@/lib/queries";
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
          Blind hides your name. Tracks and videos are named. Keep / Pass ranks the work, not clicks. Valid email and
          a Cash App cashtag required so you are ready when the pot opens.
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
    screen: remainingToday(store, user.id, "screen"),
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <p className="eyebrow">{user.cashtag}</p>
      <h1 className="display mt-3 text-5xl">Put it on the board</h1>
      <p className="mt-4 text-mist">
        {store.chargesLive
          ? "Blind is $20 because strangers cannot vote for a famous name. Tracks and videos are $5. Keep / Pass ranks both — clicks never buy first place."
          : "The cash pot is off while the board fills. Enter free. Same judging. When the house opens the pot, new Blind entries will be $20 and tracks/videos $5."}
      </p>
      {!user.cashtag && (
        <p className="mt-4 border border-copper-400/40 p-4 text-sm">
          Add a Cash App cashtag in <Link href="/studio" className="text-copper-300">Studio</Link> before you can be
          paid.
        </p>
      )}
      <EnterForm
        remaining={user.cashtag ? remaining : { blind: 0, tracks: 0, screen: 0 }}
        stripeReady={stripeEnabled()}
        chargesLive={Boolean(store.chargesLive)}
      />
    </div>
  );
}
