import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import { APP_CREDIT } from "@/lib/config";
import type { SessionUser } from "@/lib/types";

export default function Header({ user }: { user: SessionUser | null }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink-950/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="leading-tight">
          <span className="display block text-xl tracking-tight text-paper">
            <BrandMark />
          </span>
          <span className="block text-[10px] uppercase tracking-[0.18em] text-mist">{APP_CREDIT}</span>
        </Link>
        <nav className="flex items-center gap-3 text-[12px] uppercase tracking-[0.2em] text-mist sm:gap-5">
          {user ? (
            <a href="/studio" className="text-copper-300 hover:text-copper-200">
              Studio
            </a>
          ) : (
            <a href="/login" className="hover:text-copper-200">
              Sign in
            </a>
          )}
          <a href="/enter" className="btn-copper !px-4 !py-2">
            Submit
          </a>
        </nav>
      </div>
    </header>
  );
}
