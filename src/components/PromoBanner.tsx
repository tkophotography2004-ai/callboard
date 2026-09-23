import Link from "next/link";
import { FOUNDING_PASS_LINE, WEEKLY_GIVEAWAY_LINE, freeWeekEndLabel, submissionsAreFree } from "@/lib/rules";

type Giveaway = {
  weekId: string;
  userId: string | null;
  username: string;
  displayName: string;
} | null;

export default function PromoBanner({
  foundingPassCount,
  foundingPassLimit,
  weeklyGiveaway,
}: {
  foundingPassCount: number;
  foundingPassLimit: number;
  weeklyGiveaway: Giveaway;
}) {
  const left = Math.max(0, foundingPassLimit - foundingPassCount);
  const claimed = Math.min(foundingPassCount, foundingPassLimit);
  const winner = weeklyGiveaway?.userId ? weeklyGiveaway.displayName || weeklyGiveaway.username : "";

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      {submissionsAreFree() ? (
        <div className="mb-4 border border-copper-400/40 bg-black/40 p-5 sm:p-6">
          <p className="eyebrow">Platform make-good</p>
          <p className="mt-2 text-sm text-mist">
            All submissions — including Blind — are free through {freeWeekEndLabel()}. No Stripe charge this window.
            Founding free-20 codes and Studio passes still work after paid entry resumes.
          </p>
        </div>
      ) : null}
      <div className="border border-copper-400/40 bg-black/40 p-6 sm:p-8">
        <p className="eyebrow">Free submissions</p>
        <h2 className="display mt-3 max-w-3xl text-3xl sm:text-4xl">
          {left > 0 ? FOUNDING_PASS_LINE : "The first 20 free passes are claimed."}
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-mist">
          {left > 0
            ? `${claimed} of ${foundingPassLimit} claimed. ${left} left. Add your work and the pass sits in Studio until you want it.`
            : "Weekly random giveaways still run."}{" "}
          {WEEKLY_GIVEAWAY_LINE} It lives in Studio. Use it on any lounge, any later week.
        </p>
        {winner ? (
          <p className="mt-3 text-sm text-copper-200">This week’s free pass went to {winner}.</p>
        ) : (
          <p className="mt-3 text-sm text-paper/70">This week’s giveaway draws once artists are on the board.</p>
        )}
        <div className="mt-6 h-1.5 w-full max-w-md bg-white/10">
          <div
            className="h-full bg-copper-400"
            style={{ width: `${Math.round((claimed / foundingPassLimit) * 100)}%` }}
          />
        </div>
        <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-white/45">
          {claimed} / {foundingPassLimit} founding passes
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/enter" className="btn-copper">
            Add your work
          </Link>
          <Link href="/studio" className="btn-ghost">
            Check Studio
          </Link>
        </div>
      </div>
    </section>
  );
}
