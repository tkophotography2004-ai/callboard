import Link from "next/link";
import type { SessionUser } from "@/lib/types";

export default function Header({ user }: { user: SessionUser | null }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink-950/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="display text-xl tracking-tight text-paper">
          Callboard
        </Link>
        <nav className="hidden items-center gap-6 text-[12px] uppercase tracking-[0.2em] text-mist md:flex">
          <Link href="/judge?arena=blind" className="hover:text-copper-200">
            Judge
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
          <Link href="/how" className="hover:text-copper-200">
            Rules
          </Link>
          {user ? (
            <Link href="/studio" className="text-copper-300 hover:text-copper-200">
              Studio
            </Link>
          ) : (
            <Link href="/login" className="hover:text-copper-200">
              Sign in
            </Link>
          )}
          <Link href="/enter" className="btn-copper !px-4 !py-2">
            Enter
          </Link>
        </nav>
        <Link href="/enter" className="btn-copper !px-4 !py-2 md:hidden">
          Enter
        </Link>
      </div>
    </header>
  );
}
