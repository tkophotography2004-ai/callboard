"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/board/blind", label: "Board" },
  { href: "/judge?arena=blind", label: "Judge" },
  { href: "/enter", label: "Submit" },
  { href: "/studio", label: "Studio" },
];

export default function BottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ink-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
      <ul className="grid grid-cols-4">
        {items.map((item) => {
          const on =
            path === item.href ||
            (item.href.startsWith("/board") && path.startsWith("/board")) ||
            (item.href.startsWith("/judge") && path.startsWith("/judge"));
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex h-14 items-center justify-center text-[11px] uppercase tracking-[0.18em] ${
                  on ? "text-copper-300" : "text-mist"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
