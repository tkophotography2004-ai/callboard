import Link from "next/link";
import { formatUsd, splitEntry } from "@/lib/rules";

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
          <h2 className="display text-2xl text-paper">Founding board first</h2>
          <p className="mt-3">
            The cash pot can sit off while the room fills. You still enter, still judge, still see The Cut. No Stripe
            charge. When the house turns the pot on, Blind becomes {formatUsd(blind.entryCents)} and tracks/videos
            become {formatUsd(floor.entryCents)}. Cuts already on the board from the founding period are not billed.
          </p>
        </section>
        <section>
          <h2 className="display text-2xl text-paper">Clicks measure a following. Keep / Pass measures a song.</h2>
          <p className="mt-3">
            If we ranked by plays, likes, or link taps, the person with the biggest Instagram would win every week.
            That is the $40–$50 “review for exposure” internet you already know. A skip counts the same as someone
            who sat with the hook. A group chat can farm a thousand clicks in an hour. None of that tells you if the
            record is good.
          </p>
          <p className="mt-3">
            Callboard asks a stranger one question after they actually hear it: <strong className="text-paper">Keep or Pass</strong>.
            Keep means they would leave it on. Pass means they would skip. That is the only score that moves cash.
          </p>
        </section>

        <section>
          <h2 className="display text-2xl text-paper">Blind — $20</h2>
          <p className="mt-3">
            This is the talent test. Your name, page, and following are stripped off until the week closes. Cover art
            and the title stay; the artist does not. Nobody can campaign “vote for me.” They can only vote for the
            sound. One Blind entry per 24 hours.
          </p>
          <p className="mt-3">
            You pay {formatUsd(blind.entryCents)}. The house keeps {formatUsd(blind.houseCents)} so this board can
            stay online. Stripe takes about {formatUsd(blind.feeCents)}. {formatUsd(blind.potCents)} goes into this
            week’s Blind pot. Ten artists is already a serious cash prize — and it was not bought with a fan army.
          </p>
        </section>

        <section>
          <h2 className="display text-2xl text-paper">Tracks and videos — $5</h2>
          <p className="mt-3">
            Named boards. Your name is on the page. You can share the link. People can tap Share so more strangers
            land on Judge. Share count is shown. It never ranks the pot. Keep / Pass still decides the money. Videos
            under 2 minutes live here — music videos, series teasers, shorts. Tracks and videos share a cap of 3
            submissions per 24 hours.
          </p>
          <p className="mt-3">
            You pay {formatUsd(floor.entryCents)}. House keeps {formatUsd(floor.houseCents)}. Stripe about{" "}
            {formatUsd(floor.feeCents)}. {formatUsd(floor.potCents)} goes in that board’s pot.
          </p>
        </section>

        <section>
          <h2 className="display text-2xl text-paper">How The Cut is scored</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5">
            <li>A scout plays the preview. Name is hidden on every board while they listen.</li>
            <li>They tap Keep or Pass. One vote per person per cut.</li>
            <li>You need at least 5 scout votes to rank. Until then the row says Building.</li>
            <li>
              Rank is a Wilson score, not a raw Keep percentage. 3 Keeps out of 3 does not beat 40 Keeps out of 50.
              Early luck cannot steal a pot from a song that held up in front of more ears.
            </li>
            <li>Week closes Sunday UTC. Cut #1 takes 70%, Cut #2 takes 30%. Under $10, Cut #1 takes all of it.</li>
          </ol>
        </section>

        <section>
          <h2 className="display text-2xl text-paper">What you are paying for</h2>
          <p className="mt-3">
            Other sites charge $40 or $50 for a written review and a hope of exposure. Here the fee is an entry into
            a cash pot, judged by people who do not know who you are (on Blind) or who still have to Keep the record
            (on $5). The house cut is how Callboard stays up. The rest, after Stripe, is prize money paid to the Cash
            App cashtag on the winning account.
          </p>
        </section>

        <section>
          <h2 className="display text-2xl text-paper">Payouts and house rights</h2>
          <p className="mt-3">
            Keep your cashtag accurate. You are responsible for tax on winnings. You keep the work. Callboard may
            stream the preview for judging and for that week’s board. No hate, no stolen files, no bought votes. We
            can remove an entry and void a payout.
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
