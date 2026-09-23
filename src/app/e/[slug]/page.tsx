import Link from "next/link";
import { notFound } from "next/navigation";
import ArtistLinks from "@/components/ArtistLinks";
import HeatButton from "@/components/HeatButton";
import MediaPlayer from "@/components/MediaPlayer";
import ShareBar from "@/components/ShareBar";
import { APP_NAME_MARK, entryUrl } from "@/lib/config";
import { formatDuration } from "@/lib/format";
import { ARENA_LABEL, SCREEN_KIND_LABEL } from "@/lib/rules";
import { toPublic } from "@/lib/queries";
import { readStore } from "@/lib/store";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await readStore();
  const entry = store.entries.find((e) => e.slug === slug && e.status === "paid");
  if (!entry) return { title: "Entry" };
  const pub = toPublic(store, entry);
  return {
    title: pub.hiddenArtist ? `${pub.title} — Blind cut` : `${pub.title} — ${pub.artist}`,
    description: pub.logline,
    openGraph: {
      title: `${pub.title} · ${APP_NAME_MARK}`,
      description: pub.logline,
      images: [pub.coverPath],
    },
  };
}

export default async function EntryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await readStore();
  const entry = store.entries.find((e) => e.slug === slug && e.status === "paid");
  if (!entry) notFound();
  const pub = toPublic(store, entry);
  const url = entryUrl(entry.slug);

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <p className="eyebrow">
        {ARENA_LABEL[pub.arena]}
        {pub.screenKind ? ` · ${SCREEN_KIND_LABEL[pub.screenKind]}` : ""} · {pub.genre}
      </p>
      <h1 className="display mt-3 text-4xl">{pub.title}</h1>
      <p className="mt-1 text-mist">{pub.hiddenArtist ? "Artist locked until the week closes" : pub.artist}</p>
      <p className="mt-4 text-paper/80">{pub.logline}</p>

      <div className="relative mt-6 overflow-hidden border border-white/10">
        <ShareBar overlay url={url} title={pub.title} />
        <MediaPlayer
          coverPath={pub.coverPath}
          mediaPath={pub.mediaPath}
          arena={pub.arena}
          durationSeconds={pub.durationSeconds}
          hookStartSeconds={pub.hookStartSeconds}
          anonymous={pub.hiddenArtist}
        />
      </div>
      {pub.links && !pub.hiddenArtist && <ArtistLinks links={pub.links} />}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {pub.hiddenArtist ? (
          <Link href={`/judge?arena=blind`} className="btn-copper">
            Judge Blind instead
          </Link>
        ) : (
          <>
            <HeatButton entryId={pub.id} initial={pub.heatVotes} />
            <ShareBar url={url} title={pub.title} />
          </>
        )}
      </div>
      {pub.hiddenArtist && (
        <p className="mt-3 text-sm text-mist">
          Sharing this page will not add clicks to the Blind pot. Send people to Judge.
        </p>
      )}
      <p className="mt-4 text-sm text-mist">
        {pub.qualified ? `${Math.round(pub.keepPct * 100)}% keep from ${pub.sample} scouts` : "Still building The Cut"}{" "}
        · {formatDuration(pub.durationSeconds)}
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href={`/judge?arena=${pub.arena}`} className="btn-copper">
          Judge more
        </Link>
        <Link href={`/board/${pub.arena}`} className="btn-ghost">
          Full board
        </Link>
      </div>
    </div>
  );
}
