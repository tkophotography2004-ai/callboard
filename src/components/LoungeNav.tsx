import { ARENAS, ARENA_LABEL } from "@/lib/rules";

export default function LoungeNav() {
  return (
    <nav className="border-b border-white/10 bg-ink-950" aria-label="Lounges">
      <ul className="mx-auto flex max-w-6xl flex-wrap gap-2 px-4 py-2">
        {ARENAS.map((arena) => (
          <li key={arena}>
            <a href={`/board/${arena}`} className="btn-ghost !px-3 !py-2 text-[11px]">
              {ARENA_LABEL[arena].replace(" Lounge", "")}
            </a>
          </li>
        ))}
        <li>
          <a href="/judge?arena=blind" className="btn-ghost !px-3 !py-2 text-[11px]">
            Judge
          </a>
        </li>
        <li>
          <a href="/how" className="btn-ghost !px-3 !py-2 text-[11px]">
            Rules
          </a>
        </li>
      </ul>
    </nav>
  );
}
