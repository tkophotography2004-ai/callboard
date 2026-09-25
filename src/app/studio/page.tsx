import Link from "next/link";
import { redirect } from "next/navigation";
import ShareBar from "@/components/ShareBar";
import { getSessionUser } from "@/lib/auth";
import { entryUrl } from "@/lib/config";
import { ARENAS, formatUsd } from "@/lib/rules";
import { remainingToday, toPublic } from "@/lib/queries";
import { fanPlaces } from "@/lib/ranking";
import { EMPTY_LINKS } from "@/lib/types";
import { unusedPassCodesForUser } from "@/lib/promo";
import { readStore } from "@/lib/store";
import { isoWeekId } from "@/lib/week";
import StudioClient from "./ui";

export const metadata = { title: "Studio" };

export default async function StudioPage({
  searchParams,
}: {
  searchParams: Promise<{
    paid?: string;
    canceled?: string;
    founding?: string;
    beta?: string;
    pass?: string;
    usedpass?: string;
    code?: string;
  }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/studio");
  const store = await readStore();
  const full = store.users.find((u) => u.id === user.id);
  const remaining = Object.fromEntries(ARENAS.map((a) => [a, remainingToday(store, user.id, a)])) as Record<
    (typeof ARENAS)[number],
    number
  >;
  const fanRow = fanPlaces(store, isoWeekId()).find((p) => p.user.id === user.id);
  const mine = store.entries
    .filter((e) => e.userId === user.id)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .map((e) => ({
      ...toPublic(store, e),
      // Owner always sees their own real title; public views stay masked.
      title: e.title,
      shareTitle: toPublic(store, e).title,
      status: e.status,
      weekId: e.weekId,
      potCents: e.potCents,
    }));
  const payouts = store.payouts.filter((p) => p.userId === user.id);
  const sp = await searchParams;
  const passCodes = unusedPassCodesForUser(store, user.id);
  const awardedCode = (sp.code || "").trim().toUpperCase();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="eyebrow">{user.email}</p>
      <h1 className="display mt-3 text-5xl">Studio</h1>
      {sp.paid === "1" && (
        <p className="mt-4 border border-copper-400/40 p-4 text-sm">
          Paid. The cut is on the board. On Music, Film, Music Video, and Creator, copy the share link below and send it
          to your fans. Shares never rank the pot.
        </p>
      )}
      {sp.beta === "1" && (
        <p className="mt-4 border border-copper-400/40 p-4 text-sm">
          You're on the board — named lounges are free during beta. Copy the share link below and send it to your
          fans. Shares never rank the pot.
        </p>
      )}
      {sp.founding === "1" && (
        <p className="mt-4 border border-copper-400/40 p-4 text-sm">
          You are on the founding board. No charge. When the house opens the pot, new entries will be paid — this one
          stays free.
        </p>
      )}
      {sp.pass === "1" && (
        <p className="mt-4 border border-copper-400/40 p-4 text-sm">
          You earned a free submission. It is waiting here. Use it on any lounge, any later week.
          {awardedCode ? (
            <>
              {" "}
              <span className="mt-2 block font-mono text-base text-copper-200">
                Your free submission code: {awardedCode} — use it next time on Submit.
              </span>
            </>
          ) : null}
        </p>
      )}
      {awardedCode && sp.pass !== "1" && (
        <p className="mt-4 border border-copper-400/40 p-4 text-sm">
          Your free submission code:{" "}
          <span className="font-mono text-base text-copper-200">{awardedCode}</span> — use it next time on Submit.
        </p>
      )}
      {sp.usedpass === "1" && (
        <p className="mt-4 border border-copper-400/40 p-4 text-sm">Free pass used. The cut is on the board.</p>
      )}
      {sp.canceled === "1" && (
        <p className="mt-4 border border-white/15 p-4 text-sm text-mist">Checkout canceled. Nothing was charged.</p>
      )}
      <p className="mt-4 text-mist">
        Blind left today: {remaining.blind} of 1. Other lounges: Music {remaining.tracks}, Film {remaining.film}, Video{" "}
        {remaining.video}, Creator {remaining.creator} of 3 each. Free passes: {user.freePasses || 0}. Winnings go to{" "}
        {[user.cashtag, user.paypalEmail].filter(Boolean).join(" or ") || "Cash App or PayPal (optional — add below)"}.
      </p>
      <p className="mt-3 text-sm text-mist">
        Fan pot this week: {fanRow ? `${fanRow.votes} judged · rank #${fanRow.rank}` : "Judge cuts to earn a shot."} Add
        socials below so they show if you land a featured fan spot.
      </p>
      {(user.freePasses || 0) > 0 && (
        <p className="mt-3 text-sm text-copper-200">
          You have {user.freePasses} free {user.freePasses === 1 ? "pass" : "passes"} to use on a later submission.
          {passCodes.length > 0 ? (
            <>
              {" "}
              Code{passCodes.length === 1 ? "" : "s"}:{" "}
              <span className="font-mono text-paper">{passCodes.join(", ")}</span> — paste on Submit.
            </>
          ) : null}
        </p>
      )}
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/enter" className="btn-copper">
          New entry
        </Link>
        <form action="/api/auth/logout" method="post">
          <button className="btn-ghost" type="submit">
            Sign out
          </button>
        </form>
      </div>

      <StudioClient
        cashtag={user.cashtag}
        paypalEmail={full?.paypalEmail || user.paypalEmail || ""}
        links={{ ...EMPTY_LINKS, ...(full?.links || {}) }}
      />

      <h2 className="display mt-12 text-3xl">Your cuts</h2>
      {mine.length === 0 ? (
        <p className="mt-4 text-mist">Nothing submitted yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-white/10 border border-white/10">
          {mine.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-3 p-4">
              <div>
                <Link href={`/e/${e.slug}`} className="text-paper hover:text-copper-200">
                  {e.title}
                </Link>
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/40">
                  {e.arena} · {e.status} · {e.weekId}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {e.status === "paid" && !e.hiddenArtist && (
                  <ShareBar compact url={entryUrl(e.slug)} title={e.shareTitle} />
                )}
                <p className="text-sm text-mist">{e.heatVotes} heat</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <h2 className="display mt-12 text-3xl">Payouts</h2>
      {payouts.length === 0 ? (
        <p className="mt-4 text-mist">When you place as an artist or a featured fan, Cash App or PayPal payouts land here.</p>
      ) : (
        <ul className="mt-4 divide-y divide-white/10 border border-white/10">
          {payouts.map((p) => (
            <li key={p.id} className="flex items-center justify-between p-4">
              <div>
                <p className="uppercase tracking-[0.16em] text-[11px] text-copper-300">
                  {p.place} · {p.weekId}
                </p>
                <p className="text-sm text-mist">
                  {[p.cashtag, p.paypalEmail].filter(Boolean).join(" · ") || "—"}
                </p>
              </div>
              <p>
                {formatUsd(p.amountCents)} · {p.status}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
