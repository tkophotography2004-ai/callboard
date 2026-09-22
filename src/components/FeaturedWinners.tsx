import Link from "next/link";
import ArtistLinks from "./ArtistLinks";
import ShareBar from "./ShareBar";
import { entryUrl } from "@/lib/config";
import { weekLabel } from "@/lib/week";
import type { PublicEntry } from "@/lib/queries";

const PLACE = ["1st", "2nd", "3rd"];

export default function FeaturedWinners({
  weekId,
  winners,
}: {
  weekId: string;
  winners: PublicEntry[];
}) {
  if (!winners.length) {
    return (
      <section className="mt-10 border border-white/10 p-5">
        <p className="eyebrow">Featured winners</p>
        <p className="mt-3 text-sm text-mist">
          Top 3 of this lounge appear here after Sunday’s crown. Their socials and music links unlock then.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-10">
      <p className="eyebrow">Featured winners · {weekLabel(weekId)}</p>
      <h2 className="display mt-2 text-3xl">Top 3</h2>
      <ol className="mt-5 grid gap-4 sm:grid-cols-3">
        {winners.map((e, i) => (
          <li key={e.id} className="border border-copper-400/30 bg-black/30">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={e.coverPath} alt="" className="aspect-[4/5] w-full object-cover" />
              <ShareBar overlay url={entryUrl(e.slug)} title={e.title} />
              <p className="absolute bottom-3 left-3 display text-2xl text-paper drop-shadow">{PLACE[i]}</p>
            </div>
            <div className="p-4">
              <Link href={`/e/${e.slug}`} className="display text-xl text-paper hover:text-copper-200">
                {e.title}
              </Link>
              <p className="mt-1 text-sm text-mist">{e.artist}</p>
              <ArtistLinks links={e.links} />
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
