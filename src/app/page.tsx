import Link from "next/link";
import BoardList from "@/components/BoardList";
import BrandMark from "@/components/BrandMark";
import FeaturedFans from "@/components/FeaturedFans";
import LiveBadge from "@/components/LiveBadge";
import PromoBanner from "@/components/PromoBanner";
import {
  ARENAS,
  ARENA_LABEL,
  FAN_POT_LINE,
  LIMITS_LINE,
  namedLoungesAreFree,
  namedPriceLine,
  namedPriceSentence,
  NOTHING_LIKE_THIS,
  PAYDAY_LINE,
  potCapLine,
  formatUsd,

} from "@/lib/rules";
import { APP_CREDIT } from "@/lib/config";
import { homeData } from "@/lib/queries";

export default async function HomePage() {
  const data = await homeData();

  return (
    <>
      <section className="relative min-h-[78dvh] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/seed/hero.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-hero-fade" />
        <div className="relative mx-auto flex min-h-[78dvh] max-w-6xl flex-col justify-end px-4 pb-14 pt-24">
          <p className="display text-5xl leading-none sm:text-6xl">
            <BrandMark />
          </p>
          <p className="mt-2 text-sm uppercase tracking-[0.22em] text-paper/70">{APP_CREDIT}</p>
          <div className="mt-5">
            <LiveBadge live={data.chargesLive} href="/enter" size="lg" />
          </div>
          <p className="eyebrow mt-8">This week · {data.weekLabel}</p>
          <h1 className="display mt-4 max-w-3xl text-5xl leading-[0.95] sm:text-7xl">
            The name comes off.
            <br />
            The record stays on.
          </h1>
          <p className="mt-5 max-w-xl text-base text-paper/80">
            Blind is $30 — music tracks only. Track, Film, Music Video, and Creator lounges are{" "}
            {namedPriceSentence()}. Strangers Keep or Pass. Clicks cannot buy first place.{" "}
            {FAN_POT_LINE}
          </p>
          <p className="mt-3 max-w-xl text-sm text-paper/70">
            {potCapLine()} {PAYDAY_LINE} {LIMITS_LINE}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/judge?arena=blind" className="btn-copper">
              Judge and earn
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

      <PromoBanner
        foundingPassCount={data.foundingPassCount}
        foundingPassLimit={data.foundingPassLimit}
        weeklyGiveaway={data.weeklyGiveaway}
      />

      <section className="mx-auto max-w-6xl px-4 py-6">
        <div className="border border-copper-400/40 bg-black/40 p-6 sm:p-8">
          <p className="eyebrow">Fan pot · this week</p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <h2 className="display text-4xl sm:text-5xl">Judge. Earn. Come back.</h2>
            <p className="display text-4xl text-copper-200">{formatUsd(data.fanPotCents)}</p>
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-mist">
            {FAN_POT_LINE} Sign in, Keep or Pass, and keep a Cash App cashtag in Studio. Top fans of the week get paid
            and a featured spot with their socials.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/judge?arena=blind" className="btn-copper">
              Start judging
            </Link>
            <Link href="/signup?next=/judge" className="btn-ghost">
              Sign up as a fan
            </Link>
          </div>
          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <FeaturedFans
              title="Leading fans this week"
              fans={data.fanLeaders}
              empty="No signed-in fans have judged yet. Be first."
            />
            <FeaturedFans
              title="Featured fans"
              weekId={data.featuredFanWeekId}
              fans={data.featuredFans}
              empty="Last week’s top fans appear here after Sunday’s crown, with their socials."
            />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-6 sm:grid-cols-2 lg:grid-cols-5">
        {ARENAS.map((arena) => {
          const lounge = data[arena];
          const price = arena === "blind" ? "$30" : namedPriceLine();
          return (
            <a
              key={arena}
              href={`/board/${arena}`}
              className={`block border p-6 ${
                arena === "blind"
                  ? "border-copper-400/40 hover:border-copper-300"
                  : "border-white/10 hover:border-copper-400/50"
              }`}
            >
              <p className="eyebrow">{`${ARENA_LABEL[arena]} · ${price}`}</p>
              <p className="display mt-3 text-4xl text-copper-200">{formatUsd(lounge.potCents)}</p>
              <p className="mt-2 text-sm text-mist">{`${lounge.count} in this week`}</p>
            </a>
          );
        })}
      </section>

      <section className="mx-auto max-w-6xl px-4 py-6">
        <div className="gold-line mb-10" />
        <p className="eyebrow">The Cut</p>
        <h2 className="display mt-2 text-3xl">Blind this week</h2>
        <p className="mt-2 text-sm text-mist">Music tracks only. Name locked until Sunday.</p>
        <BoardList rows={data.blind.board} hideHeat />
        <Link href="/board/blind" className="btn-ghost mt-5">
          Full Blind board
        </Link>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-12 sm:grid-cols-2">
          <div>
            <p className="eyebrow">{namedPriceLine()}</p>
            <h2 className="display mt-2 text-3xl">Track Lounge</h2>
            <BoardList rows={data.tracks.board} />
            <Link href="/board/tracks" className="btn-ghost mt-5">
              Full track board
            </Link>
          </div>
          <div>
            <p className="eyebrow">{namedPriceLine()}</p>
            <h2 className="display mt-2 text-3xl">Film Lounge</h2>
            <BoardList rows={data.film.board} />
            <Link href="/board/film" className="btn-ghost mt-5">
              Full film board
            </Link>
          </div>
          <div>
            <p className="eyebrow">{namedPriceLine()}</p>
            <h2 className="display mt-2 text-3xl">Music Video Lounge</h2>
            <BoardList rows={data.video.board} />
            <Link href="/board/video" className="btn-ghost mt-5">
              Full music video board
            </Link>
          </div>
          <div>
            <p className="eyebrow">{namedPriceLine()} · link your video</p>
            <h2 className="display mt-2 text-3xl">Creator Lounge</h2>
            <BoardList rows={data.creator.board} />
            <Link href="/board/creator" className="btn-ghost mt-5">
              Full creator board
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
            <h3 className="display mt-2 text-2xl">Fans judge first</h3>
            <p className="mt-3 text-sm leading-relaxed text-mist">
              Play the preview. Keep or Pass. That vote ranks the artist pot and counts toward the fan pot. {FAN_POT_LINE}
            </p>
          </div>
          <div>
            <p className="text-copper-300">02</p>
            <h3 className="display mt-2 text-2xl">Blind locks the name</h3>
            <p className="mt-3 text-sm leading-relaxed text-mist">
              Blind is $30 and music only. The artist is hidden until the week closes. You vote for the record.{" "}
              {NOTHING_LIKE_THIS}
            </p>
          </div>
          <div>
            <p className="text-copper-300">03</p>
            <h3 className="display mt-2 text-2xl">The pot, then payday</h3>
            <p className="mt-3 text-sm leading-relaxed text-mist">
              {potCapLine()} {PAYDAY_LINE} {LIMITS_LINE}
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

