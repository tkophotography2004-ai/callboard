"use client";

import { useState } from "react";

export default function ShareBar({
  url,
  title,
  overlay = false,
  compact = false,
}: {
  url: string;
  title: string;
  overlay?: boolean;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function share(e?: React.MouseEvent) {
    e?.preventDefault();
    e?.stopPropagation();
    const text = `Keep or Pass: ${title} on Scroll Call®`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${title} · Scroll Call®`, url, text });
        return;
      } catch {
        /* fall through */
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  if (overlay || compact) {
    return (
      <button
        type="button"
        onClick={(e) => void share(e)}
        className={
          overlay
            ? "absolute right-3 top-3 z-10 rounded-full border border-white/30 bg-black/60 px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-paper backdrop-blur-md hover:bg-black/80"
            : "rounded-full border border-white/20 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-mist hover:text-copper-200"
        }
      >
        {copied ? "Copied" : "Share"}
      </button>
    );
  }

  return (
    <button type="button" onClick={() => void share()} className="btn-ghost">
      {copied ? "Link copied" : "Share with your community"}
    </button>
  );
}
