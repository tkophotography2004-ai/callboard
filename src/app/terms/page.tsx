import type { Metadata } from "next";
import { BRIUNKA_EMAIL } from "@/lib/rules";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Scroll Call® Terms of Service (Beta).",
};

const CONTACT_EMAIL = BRIUNKA_EMAIL;

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section id={`s${n}`} className="scroll-mt-24">
      <h2 className="display text-2xl text-paper">
        {n}. {title}
      </h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <p className="eyebrow">Legal · Beta</p>
      <h1 className="display mt-3 text-4xl sm:text-5xl">Scroll Call® Terms of Service</h1>
      <p className="mt-4 text-sm text-mist">Last updated: September 24, 2026 · Beta</p>

      <div className="mt-8 border border-copper-400/60 bg-copper-400/10 p-5 text-[15px] leading-relaxed text-paper">
        <p className="eyebrow">The short version</p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>
            Winners picked by our judges go on Scroll Call&apos;s Spotify genre playlists for free, based on merit
            only.
          </li>
          <li>
            Paying never gets you onto a Spotify playlist. We do not accept payment for Spotify playlist placement.
          </li>
          <li>
            Paid tiers buy featured spots only inside Scroll Call: the music player and genre pages.
          </li>
          <li>There are 5 featured spots per genre, rotating weekly.</li>
          <li>You keep ownership of your work. You just let us show, link, and promote it.</li>
          <li>We can remove tracks that break Spotify&apos;s rules or these terms.</li>
        </ul>
      </div>

      <div className="mt-12 space-y-10 text-[15px] leading-relaxed text-mist">
        <Section n={1} title="Acceptance and eligibility">
          <p>
            These Terms of Service (&quot;Terms&quot;) are an agreement between you and Scroll Call® (&quot;Scroll
            Call,&quot; &quot;we,&quot; &quot;us&quot;), operated by Briunka Light®. By creating an account, submitting
            an entry, judging, or paying for anything on scrollcalllive.com, you agree to these Terms. If you do not
            agree, do not use Scroll Call.
          </p>
          <p>
            You must be at least 13 years old to use Scroll Call. If you are 13 to 17, you may use Scroll Call only
            with the consent of a parent or legal guardian, who agrees to these Terms on your behalf and must be the
            one to make any payment or receive any payout. If you are 18 or older, you may use Scroll Call on your own.
          </p>
        </Section>

        <Section n={2} title="Accounts">
          <p>
            You need an account to submit, judge for the fan pot, or pay. Give accurate information, including a valid
            email and any payout details (such as a Cash App cashtag or PayPal email). Keep your password private. You
            are responsible for activity on your account. One person, one account. Tell us right away if you think
            your account has been accessed without permission.
          </p>
        </Section>

        <Section n={3} title="Submissions and content license">
          <p>
            You keep full ownership of everything you submit. By submitting, you grant Scroll Call a non-exclusive,
            worldwide, royalty-free license to display your entry, stream-link and embed it from the platform where it
            is hosted (for example Spotify, YouTube, SoundCloud, TikTok), and promote it on Scroll Call and our social
            channels. If your entry is a winning track hosted on Spotify, this license also lets us add it to Scroll
            Call&apos;s Spotify playlists. You can ask us to remove your entry at any time; removal may end your
            eligibility for that week&apos;s results.
          </p>
          <p>
            You confirm that you own or control all rights needed to submit the entry (including music, lyrics,
            samples, footage, and likenesses), that the entry does not infringe anyone&apos;s copyright, trademark,
            privacy, or other rights, and that it follows the rules of the platform where it is hosted.
          </p>
        </Section>

        <Section n={4} title="Judging and winners">
          <p>
            Winners are chosen at the discretion of Scroll Call&apos;s judges and judging process, based on merit.
            Clicks, plays, shares, and payments do not decide results. Judging decisions are final. We may adjust,
            void, or re-run results if we detect fraud, rule-breaking, or a technical error. Prize and payout details
            are described on the site and may change during beta.
          </p>
        </Section>

        <Section n={5} title="Spotify playlists">
          <ol className="list-[lower-alpha] space-y-2 pl-5">
            <li>
              Judge-selected winners are added to Scroll Call&apos;s Spotify genre playlists at no cost, based on merit
              only. No payment is required or accepted for Spotify playlist placement.
            </li>
            <li>No paid tier guarantees or influences a Spotify playlist add.</li>
            <li>
              Subscribers acknowledge that Spotify placement is merit-based and controlled solely by Scroll Call&apos;s
              judging process, not by payment.
            </li>
            <li>
              If a subscriber&apos;s track is also a contest winner, it may appear both on Scroll Call and on the
              Spotify genre playlist, but the Spotify placement is a separate, merit-based decision.
            </li>
            <li>
              Scroll Call may remove any track from its Spotify playlists that violates Spotify&apos;s terms or these
              rules.
            </li>
            <li>Only tracks available on Spotify can be added to Scroll Call&apos;s Spotify playlists.</li>
          </ol>
        </Section>

        <Section n={6} title="Paid subscription tiers">
          <p>When available, Scroll Call may offer these paid tiers:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>$5 per week — one genre.</li>
            <li>$15 per month — all genres.</li>
            <li>$25 per month — all genres, plus eligibility for featured placement (Section 7).</li>
          </ul>
          <p>
            Subscriptions renew automatically at the end of each billing period until you cancel. You can cancel
            anytime through the billing portal; you keep access until the end of the period you already paid for. We
            do not give refunds for partial periods, except where the law requires. If a payment fails, your benefits
            pause until the payment goes through. We may change prices with advance notice; new prices apply from
            your next billing period after the notice. Payments are processed by Stripe, and Stripe&apos;s terms also
            apply to your payment. We do not store your full card number.
          </p>
          <p>
            Paid contest entry fees shown at checkout are separate from subscriptions and are non-refundable once the
            entry is placed on the board, except where the law requires.
          </p>
        </Section>

        <Section n={7} title="Featured placement">
          <p>
            Featured placement appears exclusively on the Scroll Call platform (the music player and genre pages). It
            is separate from, and independent of, Spotify and Scroll Call&apos;s Spotify playlists.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Featured spots are capped at 5 per genre at a time.</li>
            <li>Spots rotate weekly.</li>
            <li>When a genre is full, eligible subscribers join a first-come, first-served queue.</li>
            <li>Featured placement does not guarantee any number of plays, votes, wins, or other results.</li>
            <li>
              If your subscription lapses, a slot you already hold for the current week may finish its week, but no
              new slots are given while your subscription is inactive or past due.
            </li>
          </ul>
        </Section>

        <Section n={8} title="Prohibited conduct">
          <p>You agree not to:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Use artificial streams, bots, click farms, fake accounts, or bought votes.</li>
            <li>Spam duplicate or near-duplicate entries.</li>
            <li>Submit content you do not have the rights to, or that infringes anyone&apos;s rights.</li>
            <li>Harass, threaten, or post hateful content about anyone.</li>
            <li>Interfere with the site, its security, or its judging process.</li>
          </ul>
        </Section>

        <Section n={9} title="Removal and termination">
          <p>
            We may remove any entry or content, void results or payouts, remove tracks from our playlists, or suspend
            or close any account that breaks these Terms or Spotify&apos;s rules, or that we reasonably believe puts
            Scroll Call, its users, or its partners at risk. You may stop using Scroll Call and close your account at
            any time. Cancel any subscription through the billing portal first. Sections that by their nature should
            survive termination (including 3, 10, 11, 12, and 13) will survive.
          </p>
        </Section>

        <Section n={10} title="Beta disclaimer">
          <p>
            Scroll Call is in beta. Features, prices, prizes, and rules may change, and things may break. The service
            is provided &quot;as is&quot; and &quot;as available,&quot; without warranties of any kind, express or
            implied, including merchantability, fitness for a particular purpose, and non-infringement, to the
            fullest extent the law allows. We do not guarantee uninterrupted service, any level of exposure, or any
            outcome.
          </p>
        </Section>

        <Section n={11} title="Limitation of liability">
          <p>
            To the fullest extent the law allows, Scroll Call and Briunka Light® will not be liable for any indirect,
            incidental, special, consequential, or punitive damages, or for lost profits, revenue, data, or goodwill.
            Our total liability for any claim relating to Scroll Call is limited to the greater of (a) the amount you
            paid Scroll Call in the 3 months before the claim arose, or (b) $50. Some places do not allow these limits,
            so they may not fully apply to you.
          </p>
        </Section>

        <Section n={12} title="Indemnification">
          <p>
            You agree to defend, indemnify, and hold harmless Scroll Call, Briunka Light®, and their owners, judges,
            and helpers from claims, losses, and costs (including reasonable attorneys&apos; fees) arising from your
            content, your use of Scroll Call, or your violation of these Terms or anyone else&apos;s rights.
          </p>
        </Section>

        <Section n={13} title="Disputes, arbitration, and governing law">
          <p>
            <strong className="text-paper">Talk to us first.</strong> Before filing any claim, contact us (Section 16)
            and give us 30 days to try to resolve it informally.
          </p>
          <p>
            <strong className="text-paper">Binding individual arbitration.</strong> If we cannot resolve it, you and
            Scroll Call agree that any dispute relating to these Terms or Scroll Call will be resolved by binding
            individual arbitration administered by the American Arbitration Association (AAA) under its Consumer
            Arbitration Rules. Either of us may instead bring an individual claim in small claims court if it
            qualifies.
          </p>
          <p>
            <strong className="text-paper">Class action waiver.</strong> Claims may be brought only on an individual
            basis, not as a plaintiff or class member in any class, collective, or representative action.
          </p>
          <p>
            <strong className="text-paper">Governing law and venue.</strong> These Terms are governed by the laws of
            the State of Mississippi, without regard to conflict-of-law rules. For any matter not subject to
            arbitration, including small claims, venue is in Hinds County, Mississippi.
          </p>
        </Section>

        <Section n={14} title="Changes to these Terms">
          <p>
            We may update these Terms, especially during beta. When we do, we will change the &quot;Last
            updated&quot; date above, and for material changes we will give notice on the site or by email. Continuing
            to use Scroll Call after changes take effect means you accept the updated Terms.
          </p>
        </Section>

        <Section n={15} title="No affiliation with Spotify">
          <p>
            Spotify is a trademark of Spotify AB. Scroll Call is not affiliated with, sponsored by, or endorsed by
            Spotify AB. Other platform names are trademarks of their owners.
          </p>
        </Section>

        <Section n={16} title="Contact">
          <p>
            Questions about these Terms? Email{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-copper-300 underline underline-offset-2">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </Section>
      </div>

      <p className="mt-16 border-t border-white/10 pt-6 text-xs text-white/60">This beta agreement may be updated.</p>
    </div>
  );
}
