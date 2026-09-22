import Link from "next/link";
import ShareBar from "./ShareBar";
import { entryUrl } from "@/lib/config";
import { formatDuration } from "@/lib/format";
import { SCREEN_KIND_LABEL } from "@/lib/rules";
import type { PublicEntry } from "@/lib/queries";

export default function BoardList({
  rows,
  hideHeat = false,
}: {
  rows: { rank: number; public: PublicEntry; qualified: boolean; keepPct: number; sample: number }[];
  hideHeat?: boolean;
}) {
  if (!rows.length) {
    return <p className="mt-6 text-mist">Nothing on this board yet. Be first.</p>;
  }
  return (
    <ol className="mt-6 divide-y divide-white/10 border border-white/10">
      {rows.map((row) => {
        const e = row.public;
        return (
          <li key={e.id}>
            <Link href={`/e/${e.slug}`} className="flex gap-4 p-4 hover:bg-white/[0.03]">
              <div className="display w-8 shrink-0 text-xl text-copper-300">{row.rank}</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={e.coverPath} alt="" className="h-16 w-16 shrink-0 object-cover sm:h-20 sm:w-20" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-paper">{e.title}</p>
                <p className="truncate text-sm text-mist">{e.hiddenArtist ? "Hidden artist" : e.artist}</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-white/40">
                  {e.screenKind ? SCREEN_KIND_LABEL[e.screenKind] : e.genre} · {formatDuration(e.durationSeconds)}
                </p>
              </div>
              <div className="shrink-0 text-right text-[11px] uppercase tracking-[0.14em]">
                {row.qualified ? (
                  <>
                    <p className="text-copper-300">{Math.round(row.keepPct * 100)}% keep</p>
                    <p className="text-white/40">{row.sample} scouts</p>
                  </>
                ) : (
                  <p className="text-white/40">Building</p>
                )}
                {!hideHeat && !e.hiddenArtist && <p className="mt-1 text-mist">{e.heatVotes} shares</p>}
                <div className="mt-2">
                  <ShareBar compact url={entryUrl(e.slug)} title={e.title} />
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
