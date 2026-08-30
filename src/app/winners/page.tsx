import Link from "next/link";
import { formatUsd, ARENA_LABEL } from "@/lib/rules";
import { readStore } from "@/lib/store";
import { weekLabel } from "@/lib/week";

export const metadata = { title: "Winners" };

export default async function WinnersPage() {
  const store = await readStore();
  const closed = [...store.weeks]
    .filter((w) => w.status === "closed")
    .sort((a, b) => Date.parse(b.closedAt || b.openedAt) - Date.parse(a.closedAt || a.openedAt));

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <p className="eyebrow">Archive</p>
      <h1 className="display mt-3 text-5xl">Winners</h1>
      {closed.length === 0 ? (
        <p className="mt-6 text-mist">The first week is still open. Check the live boards.</p>
      ) : (
        <ul className="mt-8 space-y-8">
          {closed.map((week) => {
            const payouts = store.payouts.filter((p) => p.weekId === week.id && p.arena === week.arena);
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
