import Link from "next/link";
import { notFound } from "next/navigation";
import BoardList from "@/components/BoardList";
import { ARENAS, ARENA_LABEL, formatUsd, isArena, splitEntry, type Arena } from "@/lib/rules";
import { boardPlaces, liveEntries } from "@/lib/ranking";
import { toPublic } from "@/lib/queries";
import { currentWeeks, readStore } from "@/lib/store";
import { formatCountdown, isoWeekId, msUntilWeekEnd, weekLabel } from "@/lib/week";

export async function generateMetadata({ params }: { params: Promise<{ arena: string }> }) {
  const { arena } = await params;
  if (!isArena(arena)) return { title: "Board" };
  return { title: ARENA_LABEL[arena] };
}

export default async function BoardPage({ params }: { params: Promise<{ arena: string }> }) {
  const { arena: raw } = await params;
  if (!isArena(raw)) notFound();
  const arena = raw as Arena;
  const store = await readStore();
  const weekId = isoWeekId();
  const weeks = currentWeeks(store);
  const live = liveEntries(store, arena, weekId);
  const rawPot = weeks[arena].potCents || live.reduce((s, e) => s + e.potCents, 0);
  const pot = store.chargesLive ? rawPot : 0;
  const split = splitEntry(arena);
  const rows = boardPlaces(live).map((p) => ({
    rank: p.rank,
    public: toPublic(store, p.entry),
    qualified: p.qualified,
    keepPct: p.keepPct,
    sample: p.sample,
  }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="eyebrow">
        {weekLabel(weekId)} · closes in {formatCountdown(msUntilWeekEnd(weekId))}
      </p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <h1 className="display text-5xl">{ARENA_LABEL[arena]}</h1>
        <p className="display text-3xl text-copper-200">
          {store.chargesLive ? formatUsd(pot) : `${live.length} in`}
        </p>
      </div>
      <p className="mt-4 max-w-xl text-mist">
        {arena === "blind"
          ? "Artist names are locked until Sunday. Ranked only by Keep / Pass. Clicks cannot touch this pot."
          : "Ranked by Keep / Pass after a stranger actually plays it. Share count is shown. It does not buy rank."}{" "}
        {store.chargesLive
          ? `Entry ${formatUsd(split.entryCents)} · house ${formatUsd(split.houseCents)} · pot ${formatUsd(split.potCents)} each.`
          : `Pot is off. Enter free. When it opens: ${formatUsd(split.entryCents)} in, house keeps ${formatUsd(split.houseCents)}.`}
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        {ARENAS.map((a) => (
          <Link key={a} href={`/board/${a}`} className={a === arena ? "btn-copper !py-2" : "btn-ghost !py-2"}>
            {ARENA_LABEL[a]}
          </Link>
        ))}
        <Link href={`/judge?arena=${arena}`} className="btn-ghost !py-2">
          Judge this board
        </Link>
      </div>
      <BoardList rows={rows} hideHeat={arena === "blind"} />
    </div>
  );
}
