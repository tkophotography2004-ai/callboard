import Link from "next/link";
import { notFound } from "next/navigation";
import BoardList from "@/components/BoardList";
import FeaturedWinners from "@/components/FeaturedWinners";
import { ARENAS, ARENA_LABEL, PAYDAY_LINE, potCapLine, formatUsd, isArena, type Arena } from "@/lib/rules";
import { cappedPot } from "@/lib/money";
import { boardPlaces, featuredPlaces, liveEntries } from "@/lib/ranking";
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
  const pot = store.chargesLive ? cappedPot(rawPot) : 0;
  const rows = boardPlaces(live).map((p) => ({
    rank: p.rank,
    public: toPublic(store, p.entry),
    qualified: p.qualified,
    keepPct: p.keepPct,
    sample: p.sample,
  }));
  const featuredWeek = [...store.weeks]
    .filter((w) => w.arena === arena && w.status === "closed")
    .sort((a, b) => Date.parse(b.closedAt || b.openedAt) - Date.parse(a.closedAt || a.openedAt))[0];
  const featuredEntries = featuredWeek ? liveEntries(store, arena, featuredWeek.id) : [];
  const winners = featuredPlaces(featuredEntries).map((p) => toPublic(store, p.entry));

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
          ? "Music tracks only. Artist names are locked until Sunday. Ranked only by Keep / Pass. One entry per 24 hours. Clicks cannot touch this pot."
          : arena === "creator"
            ? "For people who already pay to promote on social. Paste a YouTube, TikTok, Instagram, or Vimeo link. Keep / Pass ranks it. Share count is shown. It does not buy rank."
            : "Ranked by Keep / Pass after a stranger actually plays it. Film and music videos can be a linked YouTube, TikTok, Instagram, or Vimeo. Share count is shown. It does not buy rank."}{" "}
        {store.chargesLive
          ? `${potCapLine()} ${PAYDAY_LINE}`
          : `Pot is off. Submit free. When it opens: ${potCapLine()}`}
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
        <Link href="/enter" className="btn-ghost !py-2">
          Submit
        </Link>
      </div>
      <FeaturedWinners weekId={featuredWeek?.id || weekId} winners={winners} />
      <BoardList rows={rows} hideHeat={arena === "blind"} />
    </div>
  );
}
