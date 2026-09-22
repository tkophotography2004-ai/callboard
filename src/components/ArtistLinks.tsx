import type { ArtistLinks as Links } from "@/lib/types";
import { hasAnyLink } from "@/lib/format";

const ITEMS: { key: keyof Links; label: string }[] = [
  { key: "instagram", label: "Instagram" },
  { key: "tiktok", label: "TikTok" },
  { key: "facebook", label: "Facebook" },
  { key: "youtube", label: "YouTube" },
  { key: "spotify", label: "Spotify" },
  { key: "appleMusic", label: "Apple Music" },
  { key: "other", label: "Link" },
];

export default function ArtistLinks({ links }: { links: Links | null }) {
  if (!links || !hasAnyLink(links)) return null;
  return (
    <ul className="mt-3 flex flex-wrap gap-2">
      {ITEMS.filter((item) => links[item.key]).map((item) => (
        <li key={item.key}>
          <a
            href={links[item.key]}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex border border-copper-400/40 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-copper-200 hover:border-copper-300"
          >
            {item.label}
          </a>
        </li>
      ))}
    </ul>
  );
}
