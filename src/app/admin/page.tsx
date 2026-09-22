import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { formatUsd, ARENA_LABEL } from "@/lib/rules";
import { currentWeeks, readStore } from "@/lib/store";
import { isoWeekId, weekLabel } from "@/lib/week";
import AdminCharges from "./charges";
import AdminPayouts from "./ui";

export const metadata = { title: "Admin" };

export default async function AdminPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const store = await readStore();
  const weekId = isoWeekId();
  const weeks = currentWeeks(store);
  const pending = store.payouts.filter((p) => p.status === "pending");
  const artists = store.users.length;
  const paid = store.entries.filter((e) => e.status === "paid").length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <p className="eyebrow">Operator</p>
      <h1 className="display mt-3 text-5xl">Admin</h1>
      <p className="mt-4 text-mist">
        {artists} accounts · {paid} on the board · house {formatUsd(store.chargesLive ? store.houseCents || 0 : 0)} ·{" "}
        {weekLabel(weekId)}
      </p>
      <AdminCharges live={Boolean(store.chargesLive)} />
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {(["blind", "tracks", "screen"] as const).map((arena) => (
          <div key={arena} className="border border-white/10 p-5">
            <p className="eyebrow">{ARENA_LABEL[arena]}</p>
            <p className="display mt-2 text-3xl">{formatUsd(weeks[arena].potCents)}</p>
            <p className="mt-2 text-sm text-mist">
              {weeks[arena].entryCount} live · {weeks[arena].status}
            </p>
          </div>
        ))}
      </div>

      <h2 className="display mt-12 text-3xl">Payouts</h2>
      <p className="mt-2 text-sm text-mist">
        Copy the Cash App cashtag or PayPal email, send manually, mark sent.
      </p>
      <AdminPayouts
        rows={pending.map((p) => {
          const entry = store.entries.find((e) => e.id === p.entryId);
          const user = store.users.find((u) => u.id === p.userId);
          return {
            id: p.id,
            place: p.place,
            weekId: p.weekId,
            arena: p.arena,
            amountCents: p.amountCents,
            cashtag: p.cashtag || user?.cashtag || "",
            paypalEmail: p.paypalEmail || user?.paypalEmail || "",
            title: entry?.title || "",
            artist: user?.displayName || "",
            email: user?.email || "",
          };
        })}
      />

      <h2 className="display mt-12 text-3xl">Accounts</h2>
      <ul className="mt-4 divide-y divide-white/10 border border-white/10 text-sm">
        {store.users.map((u) => (
          <li key={u.id} className="flex flex-wrap justify-between gap-2 p-3">
            <span>
              {u.displayName} · {u.email}
            </span>
            <span className="text-mist">
              {[u.cashtag, u.paypalEmail ? `PayPal ${u.paypalEmail}` : ""].filter(Boolean).join(" · ") ||
                "no payout method"}
            </span>
          </li>
        ))}
      </ul>

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
