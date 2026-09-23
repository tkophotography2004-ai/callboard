import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { formatUsd, ARENA_LABEL, ARENAS, FOUNDING_PASS_LIMIT } from "@/lib/rules";
import { currentWeeks, readStore } from "@/lib/store";
import { isoWeekId, previousWeekId, weekLabel } from "@/lib/week";
import { collectCrateWinners } from "@/lib/crate";
import AdminCharges from "./charges";
import AdminCrate from "./crate";
import AdminPayouts from "./ui";

export const metadata = { title: "Admin" };

export default async function AdminPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const store = await readStore();
  const weekId = isoWeekId();
  const prevWeekId = previousWeekId(weekId);
  const weeks = currentWeeks(store);
  const pending = store.payouts.filter((p) => p.status === "pending");
  const sentThisWeek = store.payouts.filter((p) => p.weekId === prevWeekId && p.status === "sent").length;
  const prevLounges = ARENAS.map((arena) => {
    const week = store.weeks.find((w) => w.id === prevWeekId && w.arena === arena);
    return {
      arena,
      status: week?.status || "open",
      potCents: week?.potCents || 0,
    };
  });
  const fanPrev = store.fanWeeks.find((w) => w.weekId === prevWeekId);
  const artists = store.users.length;
  const paid = store.entries.filter((e) => e.status === "paid").length;
  const foundingPasses = [...(store.foundingPasses || [])].sort(
    (a, b) => Date.parse(a.awardedAt) - Date.parse(b.awardedAt),
  );
  const foundingClaimed = Math.min(store.foundingPassCount || foundingPasses.length, FOUNDING_PASS_LIMIT);
  const foundingLeft = Math.max(0, FOUNDING_PASS_LIMIT - foundingClaimed);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <p className="eyebrow">Operator</p>
      <h1 className="display mt-3 text-5xl">Admin</h1>
      <p className="mt-4 text-mist">
        {artists} accounts · {paid} on the board · house {formatUsd(store.chargesLive ? store.houseCents || 0 : 0)} ·{" "}
        {weekLabel(weekId)}
      </p>

      <section className="mt-8 border border-white/10 p-6">
        <p className="eyebrow">Signups</p>
        <h2 className="display mt-2 text-3xl">{artists} {artists === 1 ? "account" : "accounts"}</h2>
        {store.users.length === 0 ? (
          <p className="mt-4 text-sm text-mist">Nobody has signed up yet.</p>
        ) : (
          <ul className="mt-5 divide-y divide-white/10">
            {[...store.users]
              .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
              .map((u) => (
                <li key={u.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:justify-between">
                  <div>
                    <p className="text-paper">{u.displayName}</p>
                    <p className="text-sm text-mist">
                      @{u.username} · {u.email} · {u.cashtag || "no cashtag"}
                    </p>
                  </div>
                  <p className="text-xs uppercase tracking-[0.16em] text-white/40">
                    {new Date(u.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
          </ul>
        )}
      </section>


      <section className="mt-8 border border-white/10 p-6">
        <p className="eyebrow">Founding free 20</p>
        <h2 className="display mt-2 text-3xl">
          {foundingClaimed} of {FOUNDING_PASS_LIMIT} claimed · {foundingLeft} left
        </h2>
        <p className="mt-2 text-sm text-mist">
          First {FOUNDING_PASS_LIMIT} artists who land a paid/founding entry earn a free future submission code
          (SC-XXXXXX). Unused codes can be pasted on Submit.
        </p>
        {foundingPasses.length === 0 ? (
          <p className="mt-4 text-sm text-mist">No founding passes awarded yet.</p>
        ) : (
          <ul className="mt-5 divide-y divide-white/10">
            {foundingPasses.map((pass, i) => {
              const unused = !pass.usedAt;
              return (
                <li
                  key={pass.code}
                  className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:justify-between"
                >
                  <div>
                    <p className="text-paper">
                      #{i + 1} · {pass.displayName || pass.username}{" "}
                      <span className="font-mono text-copper-200">{pass.code}</span>
                    </p>
                    <p className="text-sm text-mist">
                      @{pass.username} · {pass.email} · awarded{" "}
                      {new Date(pass.awardedAt).toLocaleString()}
                      {pass.entryId ? ` · entry ${pass.entryId}` : ""}
                    </p>
                  </div>
                  <p
                    className={`text-xs uppercase tracking-[0.16em] ${
                      unused ? "text-copper-300" : "text-white/40"
                    }`}
                  >
                    {unused ? "unused free pass" : `used ${new Date(pass.usedAt!).toLocaleString()}`}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
        {foundingLeft > 0 && (
          <p className="mt-4 text-xs uppercase tracking-[0.16em] text-white/40">
            {foundingLeft} open slot{foundingLeft === 1 ? "" : "s"} remaining
          </p>
        )}
      </section>

      <AdminCharges live={Boolean(store.chargesLive)} />
      <AdminCrate count={collectCrateWinners(store).length} />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(["blind", "tracks", "film", "video"] as const).map((arena) => (
          <div key={arena} className="border border-white/10 p-5">
            <p className="eyebrow">{ARENA_LABEL[arena]}</p>
            <p className="display mt-2 text-3xl">{formatUsd(weeks[arena].potCents)}</p>
            <p className="mt-2 text-sm text-mist">
              {weeks[arena].entryCount} live · {weeks[arena].status}
            </p>
          </div>
        ))}
      </div>

      <h2 className="display mt-12 text-3xl">Sunday payout checklist</h2>
      <p className="mt-2 text-sm text-mist">
        The week closes Sunday 23:59 UTC. Cash App is not automatic — you send each one, then mark sent. Finish within
        10 days of the crown.
      </p>
      <AdminPayouts
        prevWeekId={prevWeekId}
        prevWeekLabel={weekLabel(prevWeekId)}
        lounges={prevLounges}
        fanClosed={fanPrev?.status === "closed"}
        sentCount={sentThisWeek}
        rows={pending.map((p) => {
          const entry = store.entries.find((e) => e.id === p.entryId);
          const user = store.users.find((u) => u.id === p.userId);
          return {
            id: p.id,
            place: p.place,
            weekId: p.weekId,
            arena: p.arena,
            amountCents: p.amountCents,
            cashtag: p.cashtag,
            title: entry?.title || "",
            artist: user?.displayName || "",
            email: user?.email || "",
          };
        })}
      />

      <h2 className="display mt-12 text-3xl">This week&apos;s entries</h2>
      <ul className="mt-4 divide-y divide-white/10 border border-white/10 text-sm">
        {store.entries
          .filter((e) => e.weekId === weekId && e.status === "paid")
          .map((e) => {
            const u = store.users.find((x) => x.id === e.userId);
            return (
              <li key={e.id} className="flex flex-wrap justify-between gap-2 p-3">
                <span>
                  {e.arena} · {e.title} · {u?.displayName}
                </span>
                <span className="text-mist">
                  {e.scoutKeeps}/{e.scoutKeeps + e.scoutPasses} keep · {e.heatVotes} heat
                </span>
              </li>
            );
          })}
      </ul>
    </div>
  );
}
