import Link from "next/link";
import JudgeClient from "@/components/JudgeClient";
import { ARENAS, ARENA_LABEL, isArena, type Arena } from "@/lib/rules";

export const metadata = { title: "Judge" };

export default async function JudgePage({
  searchParams,
}: {
  searchParams: Promise<{ arena?: string }>;
}) {
  const sp = await searchParams;
  const arena: Arena = isArena(sp.arena || "") ? (sp.arena as Arena) : "blind";
  return (
    <div className="py-10">
      <div className="mx-auto mb-6 flex max-w-xl flex-wrap gap-2 px-4">
        {ARENAS.map((a) => (
          <Link key={a} href={`/judge?arena=${a}`} className={arena === a ? "btn-copper !py-2" : "btn-ghost !py-2"}>
            {ARENA_LABEL[a]}
          </Link>
        ))}
      </div>
      <JudgeClient arena={arena} />
    </div>
  );
}
