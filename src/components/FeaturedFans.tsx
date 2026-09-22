import ArtistLinks from "./ArtistLinks";
import { weekLabel } from "@/lib/week";
import type { PublicFan } from "@/lib/queries";

export default function FeaturedFans({
  title,
  weekId,
  fans,
  empty,
}: {
  title: string;
  weekId?: string | null;
  fans: PublicFan[];
  empty: string;
}) {
  if (!fans.length) {
    return (
      <section className="border border-white/10 p-5">
        <p className="eyebrow">{title}</p>
        <p className="mt-3 text-sm text-mist">{empty}</p>
      </section>
    );
  }

  return (
    <section>
      <p className="eyebrow">
        {title}
        {weekId ? ` · ${weekLabel(weekId)}` : ""}
      </p>
      <ol className="mt-5 grid gap-4 sm:grid-cols-3">
        {fans.map((fan) => (
          <li key={fan.username} className="border border-copper-400/30 bg-black/30 p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-copper-300">#{fan.rank}</p>
            <p className="display mt-2 text-2xl text-paper">{fan.displayName}</p>
            <p className="mt-1 text-sm text-mist">@{fan.username}</p>
            <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-white/45">{fan.votes} judged</p>
            <ArtistLinks links={fan.links} />
          </li>
        ))}
      </ol>
    </section>
  );
}
