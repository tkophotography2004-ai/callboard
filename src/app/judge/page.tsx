import Link from "next/link";
import JudgeClient from "@/components/JudgeClient";
import { getSessionUser } from "@/lib/auth";
import { ARENAS, ARENA_LABEL, FAN_POT_LINE, formatUsd, isArena, type Arena } from "@/lib/rules";
import { currentFanWeek, readStore } from "@/lib/store";

export const metadata = { title: "Judge" };

export default async function JudgePage({
  searchParams,
}: {
  searchParams: Promise<{ arena?: string }>;
}) {
  const sp = await searchParams;
  const arena: Arena = isArena(sp.arena || "") ? (sp.arena as Arena) : "blind";
  const user = await getSessionUser();
  const store = await readStore();
  const fan = currentFanWeek(store);
  return (
    <div className="py-10">
      <div className="mx-auto mb-6 max-w-xl px-4">
        <div className="mb-4 border border-copper-400/40 p-4 text-sm text-mist">
          Fan pot this week: <span className="text-copper-200">{formatUsd(fan.potCents)}</span>. {FAN_POT_LINE}{" "}
          {user ? (
            "You are signed in. Every Keep or Pass counts."
          ) : (
            <>
              <Link href="/signup?next=/judge" className="text-copper-300">
                Sign in
              </Link>{" "}
              to earn. Guests can still judge the board.
            </>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {ARENAS.map((a) => (
            <Link key={a} href={`/judge?arena=${a}`} className={arena === a ? "btn-copper !py-2" : "btn-ghost !py-2"}>
              {ARENA_LABEL[a]}
            </Link>
          ))}
        </div>
      </div>
      <JudgeClient arena={arena} signedIn={Boolean(user)} />
    </div>
  );
}
