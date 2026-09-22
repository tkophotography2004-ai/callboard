import Link from "next/link";
import FeaturedFans from "@/components/FeaturedFans";
import { formatUsd, ARENA_LABEL } from "@/lib/rules";
import { fanPlaces } from "@/lib/ranking";
import { EMPTY_LINKS } from "@/lib/types";
import { readStore } from "@/lib/store";
import { weekLabel } from "@/lib/week";

export const metadata = { title: "Winners" };

export default async function WinnersPage() {
  const store = await readStore();
  const closed = [...store.weeks]
    .filter((w) => w.status === "closed")
    .sort((a, b) => Date.parse(b.closedAt || b.openedAt) - Date.parse(a.closedAt || a.openedAt));
  const closedFans = [...(store.fanWeeks || [])]
    .filter((w) => w.status === "closed")
    .sort((a, b) => Date.parse(b.closedAt || b.openedAt) - Date.parse(a.closedAt || a.openedAt));

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <p className="eyebrow">Archive</p>
      <h1 className="display mt-3 text-5xl">Winners</h1>
      <p className="mt-4 text-mist">
        Crowns after Sunday. Featured artists and fans land here. Cash App payouts are sent within 10 days of the crown.
      </p>

      {closedFans.length > 0 && (
        <div className="mt-10 space-y-8">
          {closedFans.map((week) => {
            const fans = fanPlaces(store, week.weekId)
              .slice(0, 3)
              .map((p) => ({
                rank: p.rank,
                displayName: p.user.displayName,
                username: p.user.username,
                votes: p.votes,
                links: p.user.links || { ...EMPTY_LINKS },
              }));
            const payouts = store.payouts.filter((p) => p.weekId === week.weekId && p.place.startsWith("fan-"));
            return (
              <div key={week.weekId} className="border border-white/10 p-5">
                <FeaturedFans title="Featured fans" weekId={week.weekId} fans={fans} empty="No fans crowned." />
                <p className="mt-4 display text-2xl">{formatUsd(week.potCents)} fan pot</p>
                <ul className="mt-3 space-y-2 text-sm">
                  {payouts.map((p) => {
                    const fan = store.users.find((u) => u.id === p.userId);
                    return (
                      <li key={p.id} className="flex justify-between gap-3">
                        <span>
                          {p.place} · {fan?.displayName}
                        </span>
                        <span className="text-copper-300">{formatUsd(p.amountCents)}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      {closed.length === 0 ? (
        <p className="mt-6 text-mist">The first week is still open. Check the live boards.</p>
      ) : (
        <ul className="mt-8 space-y-8">
          {closed.map((week) => {
            const payouts = store.payouts.filter(
              (p) => p.weekId === week.id && p.arena === week.arena && !p.place.startsWith("fan-"),
            );
            return (
              <li key={`${week.id}-${week.arena}`} className="border border-white/10 p-5">
                <p className="eyebrow">
                  {ARENA_LABEL[week.arena]} · {weekLabel(week.id)}
                </p>
                <p className="display mt-2 text-2xl">{formatUsd(week.potCents)} pot</p>
                <ul className="mt-4 space-y-2 text-sm">
                  {payouts.map((p) => {
                    const entry = store.entries.find((e) => e.id === p.entryId);
                    const artist = store.users.find((u) => u.id === p.userId);
                    return (
                      <li key={p.id} className="flex justify-between gap-3">
                        <span>
                          {p.place} · {entry ? <Link href={`/e/${entry.slug}`}>{entry.title}</Link> : "—"} ·{" "}
                          {artist?.displayName}
                        </span>
                        <span className="text-copper-300">{formatUsd(p.amountCents)}</span>
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
