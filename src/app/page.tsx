import Link from "next/link";
import BoardList from "@/components/BoardList";
import { formatUsd, splitEntry } from "@/lib/rules";
import { homeData } from "@/lib/queries";

export default async function HomePage() {
  const data = await homeData();
  const blind = splitEntry("blind");
  const floor = splitEntry("tracks");

  return (
    <>
      <section className="relative min-h-[78dvh] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/seed/hero.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-hero-fade" />
        <div className="relative mx-auto flex min-h-[78dvh] max-w-6xl flex-col justify-end px-4 pb-14 pt-24">
          <p className="eyebrow">This week · {data.weekLabel}</p>
          <h1 className="display mt-4 max-w-3xl text-5xl leading-[0.95] sm:text-7xl">
            The name comes off.
            <br />
            The record stays on.
          </h1>
          <p className="mt-5 max-w-xl text-base text-paper/80">
            {data.chargesLive
              ? "Blind is $20. Strangers Keep or Pass with your name locked. Clicks cannot buy it. Tracks and videos are $5 — still ranked by ears, not followers. Winners paid on Cash App."
              : "The cash pot is off while the board fills. Enter free. Judge for real. When enough artists are in, the house turns on $20 Blind and $5 tracks/videos."}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/judge?arena=blind" className="btn-copper">
              Judge Blind
            </Link>
            <Link href="/enter" className="btn-ghost">
              Enter
            </Link>
            <Link href="/how" className="btn-ghost">
              Why not clicks?
            </Link>
          </div>
          <p className="mt-5 text-[11px] uppercase tracking-[0.22em] text-paper/50">
            Closes in {data.countdown}
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-10 md:grid-cols-3">
        <Link href="/board/blind" className="border border-copper-400/40 p-6 hover:border-copper-300">
          <p className="eyebrow">{data.chargesLive ? "Blind pot · $20" : "Blind · founding"}</p>
          <p className="display mt-3 text-4xl text-copper-200">
            {data.chargesLive ? formatUsd(data.blind.potCents) : `${data.blind.count} in`}
          </p>
          <p className="mt-2 text-sm text-mist">
            {data.chargesLive
              ? `${data.blind.count} anonymous cuts · names off until Sunday`
              : "Anonymous cuts · pot opens when the house flips it on"}
          </p>
        </Link>
        <Link href="/board/tracks" className="border border-white/10 p-6 hover:border-copper-400/50">
          <p className="eyebrow">{data.chargesLive ? "Tracks pot · $5" : "Tracks · founding"}</p>
          <p className="display mt-3 text-4xl text-copper-200">
            {data.chargesLive ? formatUsd(data.tracks.potCents) : `${data.tracks.count} in`}
          </p>
          <p className="mt-2 text-sm text-mist">
            {data.chargesLive ? `${data.tracks.count} named tracks this week` : "Named tracks · free while the pot is off"}
          </p>
        </Link>
        <Link href="/board/screen" className="border border-white/10 p-6 hover:border-copper-400/50">
          <p className="eyebrow">{data.chargesLive ? "Videos pot · $5" : "Videos · founding"}</p>
          <p className="display mt-3 text-4xl text-copper-200">
            {data.chargesLive ? formatUsd(data.screen.potCents) : `${data.screen.count} in`}
          </p>
          <p className="mt-2 text-sm text-mist">
            {data.chargesLive ? `${data.screen.count} videos under 2 minutes` : "Under 2 minutes · free while the pot is off"}
          </p>
        </Link>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-6">
        <div className="gold-line mb-10" />
        <p className="eyebrow">The Cut</p>
        <h2 className="display mt-2 text-3xl">Blind this week</h2>
        <BoardList rows={data.blind.board} hideHeat />
        <Link href="/board/blind" className="btn-ghost mt-5">
          Full Blind board
        </Link>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <p className="eyebrow">$5</p>
            <h2 className="display mt-2 text-3xl">Tracks</h2>
            <BoardList rows={data.tracks.board} />
            <Link href="/board/tracks" className="btn-ghost mt-5">
              Full tracks board
            </Link>
          </div>
          <div>
            <p className="eyebrow">$5</p>
            <h2 className="display mt-2 text-3xl">Videos</h2>
            <BoardList rows={data.screen.board} />
            <Link href="/board/screen" className="btn-ghost mt-5">
              Full video board
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <p className="eyebrow">Why Keep / Pass, not clicks</p>
        <h2 className="display mt-3 max-w-3xl text-4xl">A click is a following. A Keep is a song.</h2>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          <div>
            <p className="text-copper-300">01</p>
            <h3 className="display mt-2 text-2xl">Play it first</h3>
            <p className="mt-3 text-sm leading-relaxed text-mist">
              Scouts hear a short preview. Then Keep or Pass. A view-count contest lets bots, group chats, and big
              pages farm first place without listening.
            </p>
          </div>
          <div>
            <p className="text-copper-300">02</p>
            <h3 className="display mt-2 text-2xl">Blind locks the name</h3>
            <p className="mt-3 text-sm leading-relaxed text-mist">
              On the $20 board the artist is hidden until the week closes. You cannot vote for a famous account. You
              vote for the record. That is why people will pay $20 instead of $40 for a written “review.”
            </p>
          </div>
          <div>
            <p className="text-copper-300">03</p>
            <h3 className="display mt-2 text-2xl">The house stays open</h3>
            <p className="mt-3 text-sm leading-relaxed text-mist">
              Blind: house keeps {formatUsd(blind.houseCents)}, about {formatUsd(blind.feeCents)} to Stripe,{" "}
              {formatUsd(blind.potCents)} in the pot. $5 boards: house keeps {formatUsd(floor.houseCents)},{" "}
              {formatUsd(floor.potCents)} in the pot. Winners paid on Cash App.
            </p>
          </div>
        </div>
        <Link href="/how" className="btn-ghost mt-10">
          Full judging rules
        </Link>
      </section>
    </>
  );
}
