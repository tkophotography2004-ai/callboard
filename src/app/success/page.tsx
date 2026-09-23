import Link from "next/link";
import { redirect } from "next/navigation";
import { ARENA_LABEL, isArena } from "@/lib/rules";

export const metadata = { title: "Submitted" };

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{
    session_id?: string;
    slug?: string;
    arena?: string;
    title?: string;
    founding?: string;
    beta?: string;
    pass?: string;
    usedpass?: string;
    paid?: string;
    code?: string;
  }>;
}) {
  const sp = await searchParams;
  if (sp.session_id) {
    redirect(`/api/stripe/complete?session_id=${encodeURIComponent(sp.session_id)}`);
  }

  const slug = (sp.slug || "").trim();
  const title = (sp.title || "").trim();
  const arenaRaw = (sp.arena || "").trim();
  const arena = isArena(arenaRaw) ? arenaRaw : null;
  const code = (sp.code || "").trim().toUpperCase();
  const awardedPass = sp.pass === "1";
  const usedPass = sp.usedpass === "1";
  const beta = sp.beta === "1";
  const founding = sp.founding === "1";
  const paid = sp.paid === "1" || (!beta && !founding && !usedPass && !awardedPass && !code);

  let headline = "You're on the board";
  let sub = "Your cut is live. Keep / Pass starts now.";
  if (founding) {
    headline = "You're on the founding board";
    sub = "No charge. When the house opens the pot, new entries will be paid — this one stays free.";
  } else if (beta) {
    headline = "Submitted — free during beta";
    sub = "Named lounges are free right now. Share your link with fans; shares never rank the pot.";
  } else if (usedPass && awardedPass) {
    headline = "Submitted with a free pass";
    sub = "You also earned another free submission code below.";
  } else if (usedPass) {
    headline = "Free pass used — you're on the board";
    sub = "Your cut is live.";
  } else if (awardedPass) {
    headline = "You're on the board";
    sub = "You earned a free future submission. Save the code below.";
  } else if (paid) {
    headline = "Paid — you're on the board";
    sub = "Your cut is live. On named lounges, share the link with fans; shares never rank the pot.";
  }

  const lounge = arena ? ARENA_LABEL[arena] : null;

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <p className="eyebrow">Submitted</p>
      <h1 className="display mt-3 text-5xl leading-tight sm:text-6xl">{headline}</h1>
      <p className="mt-4 text-mist">{sub}</p>

      {(title || lounge) && (
        <div className="mt-8 border border-white/10 p-5">
          {title ? <p className="display text-2xl text-paper">{title}</p> : null}
          {lounge ? <p className="mt-2 text-sm text-mist">{lounge}</p> : null}
        </div>
      )}

      {code ? (
        <div className="mt-6 border border-copper-400/40 bg-black/40 p-5">
          <p className="eyebrow">Your free submission code</p>
          <p className="mt-3 font-mono text-2xl tracking-wider text-copper-200 sm:text-3xl">{code}</p>
          <p className="mt-3 text-sm text-mist">Paste it next time on Submit to submit without paying.</p>
        </div>
      ) : null}

      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {slug ? (
          <Link href={`/e/${slug}`} className="btn-copper text-center">
            View your cut
          </Link>
        ) : null}
        <Link href={arena ? `/board/${arena}` : "/board/blind"} className="btn-ghost text-center">
          Open board
        </Link>
        <Link href="/enter" className="btn-ghost text-center">
          Submit again
        </Link>
        <Link href="/studio" className="btn-ghost text-center">
          Studio
        </Link>
      </div>
    </div>
  );
}
