import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 px-4 py-10 text-sm text-mist">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="display text-paper">Callboard</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-[12px] uppercase tracking-[0.18em]">
          <Link href="/how" className="hover:text-copper-200">
            How judging works
          </Link>
          <Link href="/winners" className="hover:text-copper-200">
            Winners
          </Link>
          <Link href="/board/blind" className="hover:text-copper-200">
            Blind
          </Link>
          <Link href="/board/tracks" className="hover:text-copper-200">
            Tracks
          </Link>
          <Link href="/board/screen" className="hover:text-copper-200">
            Videos
          </Link>
        </div>
      </div>
      <p className="mx-auto mt-6 max-w-6xl text-xs text-white/40">
        Founding board can run free until the house opens the pot. Then Blind is $20 (house keeps $12) and tracks and
        videos are $5 (house keeps $2). Stripe fees come out first. Ranked by Keep / Pass, never by clicks. Winners
        paid to the Cash App cashtag on the account.
      </p>
    </footer>
  );
}
