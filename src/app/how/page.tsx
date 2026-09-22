import Link from "next/link";
import {
  BRIUNKA_EMAIL,
  BRIUNKA_IP_LINE,
  FAN_POT_LINE,
  FOUNDING_PASS_LINE,
  LIMITS_LINE,
  NOTHING_LIKE_THIS,
  PAYDAY_LINE,
  potCapLine,
  WEEKLY_GIVEAWAY_LINE,
  namedLoungesAreFree,
  namedPriceLine,
  namedPriceSentence,
  formatUsd,
  splitEntry,
} from "@/lib/rules";

export const metadata = { title: "How it works" };

export default function HowPage() {
  const blind = splitEntry("blind");
  const floor = splitEntry("tracks");

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <p className="eyebrow">Rules</p>
      <h1 className="display mt-3 text-5xl">How judging works — and why clicks do not pay</h1>

      <div className="mt-8 space-y-10 text-[15px] leading-relaxed text-mist">
        <section>
          <h2 className="display text-2xl text-paper">The pot is live</h2>
          <p className="mt-3">
            Blind is {formatUsd(blind.entryCents)} and is music tracks only. Track, Film, Music Video, and Creator
            lounges are {namedPriceSentence()}. {LIMITS_LINE}
          </p>
        </section>
        <section>
          <h2 className="display text-2xl text-paper">Clicks measure a following. Keep / Pass measures a song.</h2>
          <p className="mt-3">
            If we ranked by plays, likes, or link taps, the person with the biggest Instagram would win every week. A
            skip counts the same as someone who sat with the hook. A group chat can farm a thousand clicks in an hour.
            None of that tells you if the record is good.
          </p>
          <p className="mt-3">
            Scroll Call® asks a stranger one question after they actually hear it:{" "}
            <strong className="text-paper">Keep or Pass</strong>. Keep means they would leave it on. Pass means they
            would skip. That is the only score that moves cash.
          </p>
        </section>

        <section>
          <h2 className="display text-2xl text-paper">Fans earn too</h2>
          <p className="mt-3">
            {FAN_POT_LINE} Sign in, judge, keep your cashtag and socials in Studio. Week closes Sunday. Top fans get
            paid and a featured spot with their links.
          </p>
        </section>

        <section>
          <h2 className="display text-2xl text-paper">Blind — $30 · music only</h2>
          <p className="mt-3">
            This is the talent test for music artists. Paste a YouTube, SoundCloud, Spotify, or Audiomack link. Your
            name, page, and following are stripped off until the week closes. The title stays; the artist does not.
            Nobody can campaign “vote for me.” They can only vote for the sound. One Blind entry per 24 hours.
          </p>
          <p className="mt-3">
            You pay {formatUsd(blind.entryCents)}. {potCapLine()}
          </p>
        </section>

        <section>
          <h2 className="display text-2xl text-paper">
            Track, Film, and Music Video Lounges — {namedPriceLine()}
          </h2>
          <p className="mt-3">
            Named lounges. Your name is on the page. You can share the link. Share count is shown. It never ranks the
            pot. Keep / Pass still decides the money. Track lounge: paste YouTube, SoundCloud, Spotify, or Audiomack.
            Film and music videos: paste YouTube, TikTok, Instagram, or Vimeo (under 2 minutes). Paste a link — it
            plays on Scroll Call®. Each lounge has its own pot. Three entries per lounge per 24 hours.
          </p>
          <p className="mt-3">
            {namedLoungesAreFree()
              ? "No charge during beta. Share the link with your fans."
              : `You pay ${formatUsd(floor.entryCents)} for launch. Regular price is $10 a submission.`}{" "}
            {potCapLine()}
          </p>
        </section>

        <section>
          <h2 className="display text-2xl text-paper">
            Creator Lounge — {namedPriceLine()}
          </h2>
          <p className="mt-3">
            You already pay social to promote a TikTok, Reel, or YouTube. Creator Lounge is the board for that work.
            Paste the link. It plays on Scroll Call®. Keep / Pass still ranks it. You still have a shot at the pot.
          </p>
          <p className="mt-3">
            {namedLoungesAreFree()
              ? "No charge during beta. Share the link with your fans."
              : `You pay ${formatUsd(floor.entryCents)} for launch. Regular price is $10 a submission.`}{" "}
            {potCapLine()}
          </p>
        </section>

        <section>
          <h2 className="display text-2xl text-paper">Film IPs</h2>
          <p className="mt-3">
            {BRIUNKA_IP_LINE}{" "}
            <a href={`mailto:${BRIUNKA_EMAIL}`} className="text-copper-300">
              {BRIUNKA_EMAIL}
            </a>
          </p>
        </section>

        <section>
          <h2 className="display text-2xl text-paper">Free passes</h2>
          <p className="mt-3">
            {FOUNDING_PASS_LINE} {WEEKLY_GIVEAWAY_LINE} The pass sits in Studio until you use it on any lounge.
          </p>
        </section>

        <section>
          <h2 className="display text-2xl text-paper">How The Cut is scored</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5">
            <li>A fan plays the preview. Name is hidden on every board while they listen.</li>
            <li>They tap Keep or Pass. One vote per person per cut. Signed-in votes count toward the fan pot.</li>
            <li>You need at least 5 scout votes to rank. Until then the row says Building.</li>
            <li>
              Rank is a Wilson score, not a raw Keep percentage. 3 Keeps out of 3 does not beat 40 Keeps out of 50.
              Early luck cannot steal a pot from a song that held up in front of more ears.
            </li>
            <li>
              Week closes Sunday. Winners are crowned then. Artist pots and the fan pot pay out on Cash App within 10
              days of the crown. Top 3 artists in each lounge become Featured Winners — that is when their socials and
              music links go public. Top fans get a featured spot with their socials the same day.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="display text-2xl text-paper">What you are paying for</h2>
          <p className="mt-3">
            Blind is a paid entry into a cash pot, judged by people who do not know who you are. Named lounges are{" "}
            {namedPriceSentence()} and still ranked by Keep / Pass. {NOTHING_LIKE_THIS}{" "}
            {potCapLine()} {PAYDAY_LINE}
          </p>
        </section>

        <section>
          <h2 className="display text-2xl text-paper">Payouts and house rights</h2>
          <p className="mt-3">
            Keep your cashtag accurate. You keep the work. Scroll Call® may stream the preview for judging and for that
            week’s board. No hate, no stolen files, no bought votes. We can remove an entry and void a payout.
          </p>
        </section>

        <section>
          <h2 className="display text-2xl text-paper">Copyright &amp; trademark</h2>
          <p className="mt-3">
            © 2026 Briunka Light®. The Scroll Call® name, logo, and site are protected. Scroll Call® is a registered trademark of Briunka Light®. All rights reserved.
          </p>
        </section>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/judge?arena=blind" className="btn-copper">
          Judge Blind
        </Link>
        <Link href="/enter" className="btn-ghost">
          Enter
        </Link>
      </div>
    </div>
  );
}
