"use client";

import { formatUsd, type Arena } from "@/lib/rules";

type Row = {
  id: string;
  place: string;
  weekId: string;
  arena: Arena;
  amountCents: number;
  cashtag: string;
  paypalEmail: string;
  title: string;
  artist: string;
  email: string;
};

export default function AdminPayouts({ rows }: { rows: Row[] }) {
  if (!rows.length) return <p className="mt-4 text-mist">No pending payouts. Weeks close automatically.</p>;

  async function mark(id: string) {
    await fetch("/api/admin/payouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "sent" }),
    });
    window.location.reload();
  }

  return (
    <ul className="mt-4 divide-y divide-white/10 border border-white/10">
      {rows.map((r) => {
        const payoutTo = [r.cashtag, r.paypalEmail ? `PayPal ${r.paypalEmail}` : ""].filter(Boolean).join(" · ");
        return (
          <li key={r.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-copper-300">
                {r.place} · {r.arena} · {r.weekId}
              </p>
              <p>
                {r.title} — {r.artist}
              </p>
              <p className="text-sm text-mist">
                {payoutTo || "No payout method"} · {r.email} · {formatUsd(r.amountCents)}
              </p>
            </div>
            <button type="button" className="btn-copper !py-2" onClick={() => void mark(r.id)}>
              Mark sent
            </button>
          </li>
        );
      })}
    </ul>
  );
}
