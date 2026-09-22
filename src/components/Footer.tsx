import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import { APP_CREDIT, COPYRIGHT_LINE } from "@/lib/config";
import { potCapLine } from "@/lib/rules";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 px-4 py-10 text-sm text-mist">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="display text-paper">
          <BrandMark /> <span className="text-sm font-sans font-normal text-mist">{APP_CREDIT}</span>
        </p>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-[12px] uppercase tracking-[0.18em]">
          <Link href="/judge?arena=blind" className="hover:text-copper-200">
            Judge
          </Link>
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
            Track
          </Link>
          <Link href="/board/film" className="hover:text-copper-200">
            Film
          </Link>
          <Link href="/board/video" className="hover:text-copper-200">
            Music Video
          </Link>
          <Link href="/board/creator" className="hover:text-copper-200">
            Creator
          </Link>
        </div>
      </div>
      <p className="mx-auto mt-6 max-w-6xl text-xs text-white/40">
        Blind is $30, music tracks only, one per 24 hours. Track, Film, Music Video, and Creator lounges are $5 for
        launch (regular $10 a submission), three per 24 hours. Fans who Keep or Pass can earn and get a featured spot.{" "}
        {potCapLine()} Ranked by
        Keep / Pass. The week closes Sunday. Cash App payouts within 10 days of the crown. There is nothing like this.
        If there were, they would charge way more.
      </p>
      <p className="mx-auto mt-4 max-w-6xl text-xs text-white/40">{COPYRIGHT_LINE}</p>
    </footer>
  );
}

