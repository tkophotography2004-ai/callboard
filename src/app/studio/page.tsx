import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { formatUsd } from "@/lib/rules";
import { remainingToday, toPublic } from "@/lib/queries";
import { readStore } from "@/lib/store";
import StudioClient from "./ui";

export const metadata = { title: "Studio" };

export default async function StudioPage({
  searchParams,
}: {
  searchParams: Promise<{ paid?: string; canceled?: string; founding?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/studio");
  const store = await readStore();
  const remainingBlind = remainingToday(store, user.id, "blind");
  const remainingFloor = remainingToday(store, user.id, "tracks");
  const mine = store.entries
    .filter((e) => e.userId === user.id)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .map((e) => ({
      ...toPublic(store, e),
      status: e.status,
      weekId: e.weekId,
      potCents: e.potCents,
    }));
  const payouts = store.payouts.filter((p) => p.userId === user.id);
  const sp = await searchParams;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="eyebrow">{user.email}</p>
      <h1 className="display mt-3 text-5xl">Studio</h1>
      {sp.paid === "1" && (
        <p className="mt-4 border border-copper-400/40 p-4 text-sm">Paid. The cut is on the board.</p>
      )}
      {sp.founding === "1" && (
        <p className="mt-4 border border-copper-400/40 p-4 text-sm">
          You are on the founding board. No charge. When the house opens the pot, new entries will be paid — this one
          stays free.
        </p>
      )}
      {sp.canceled === "1" && (
        <p className="mt-4 border border-white/15 p-4 text-sm text-mist">Checkout canceled. Nothing was charged.</p>
      )}
      <p className="mt-4 text-mist">
        Blind left today: {remainingBlind}. $5 tracks/videos left: {remainingFloor}. Winnings go to{" "}
        {user.cashtag || "your Cash App cashtag"}.
      </p>
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

      <StudioClient cashtag={user.cashtag} />

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
              <p className="text-sm text-mist">{e.heatVotes} heat</p>
            </li>
          ))}
        </ul>
      )}

      <h2 className="display mt-12 text-3xl">Payouts</h2>
      {payouts.length === 0 ? (
        <p className="mt-4 text-mist">When you place, Cash App payouts land here.</p>
      ) : (
        <ul className="mt-4 divide-y divide-white/10 border border-white/10">
          {payouts.map((p) => (
            <li key={p.id} className="flex items-center justify-between p-4">
              <div>
                <p className="uppercase tracking-[0.16em] text-[11px] text-copper-300">
                  {p.place} · {p.weekId}
                </p>
                <p className="text-sm text-mist">{p.cashtag}</p>
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
