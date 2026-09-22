"use client";

import { useEffect, useMemo, useState } from "react";
import { formatUsd, PAYOUT_DAYS, type Arena } from "@/lib/rules";

type Row = {
  id: string;
  place: string;
  weekId: string;
  arena: Arena;
  amountCents: number;
  cashtag: string;
  title: string;
  artist: string;
  email: string;
};

type LoungeStatus = {
  arena: string;
  status: string;
  potCents: number;
};

const STEPS = [
  { id: "open-admin", label: "Open this page after Sunday close (Monday morning). That visit crowns winners." },
  { id: "confirm-closed", label: "Confirm last week is Closed on every lounge and the fan pot." },
  { id: "open-cashapp", label: "Open Cash App on your phone." },
  { id: "send-rows", label: "Send each pending payout below. Copy the cashtag, send the amount, then Mark sent." },
  { id: "done", label: `Keep receipts. Finish all sends within ${PAYOUT_DAYS} days of the crown.` },
] as const;

function payoutLine(r: Row) {
  return `${r.cashtag}  ${formatUsd(r.amountCents)}  ${r.place}  ${r.title || r.artist}  ${r.email}`;
}

export default function AdminPayouts({
  rows,
  prevWeekId,
  prevWeekLabel,
  lounges,
  fanClosed,
  sentCount,
}: {
  rows: Row[];
  prevWeekId: string;
  prevWeekLabel: string;
  lounges: LoungeStatus[];
  fanClosed: boolean;
  sentCount: number;
}) {
  const storageKey = `scroll-call-sunday-${prevWeekId}`;
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setChecked(JSON.parse(raw) as Record<string, boolean>);
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  function toggle(id: string) {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }

  async function copy(text: string, id: string) {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    window.setTimeout(() => setCopied(""), 1500);
  }

  const allCopy = useMemo(() => rows.map(payoutLine).join("\n"), [rows]);
  const allClosed = lounges.every((l) => l.status === "closed") && fanClosed;

  async function mark(id: string) {
    await fetch("/api/admin/payouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "sent" }),
    });
    window.location.reload();
  }

  return (
    <div className="mt-4 space-y-6">
      <div className="border border-white/10 p-5">
        <p className="eyebrow">Week that closed Sunday</p>
        <p className="display mt-2 text-2xl">
          {prevWeekLabel} · {prevWeekId}
        </p>
        <p className="mt-2 text-sm text-mist">
          {allClosed
            ? "Last week is closed. Work the list."
            : "Last week is still open until someone loads the site after Sunday 23:59 UTC. Refresh this page Monday morning to crown winners."}
        </p>
        <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          {lounges.map((l) => (
            <li key={l.arena} className="flex justify-between border border-white/10 px-3 py-2">
              <span className="capitalize">{l.arena}</span>
              <span className="text-mist">
                {l.status} · {formatUsd(l.potCents)}
              </span>
            </li>
          ))}
          <li className="flex justify-between border border-white/10 px-3 py-2">
            <span>Fan pot</span>
            <span className="text-mist">{fanClosed ? "closed" : "open"}</span>
          </li>
        </ul>
      </div>

      <ol className="space-y-2 border border-white/10 p-5">
        {STEPS.map((step, i) => (
          <li key={step.id}>
            <label className="flex cursor-pointer items-start gap-3 text-sm text-paper">
              <input
                type="checkbox"
                className="mt-1"
                checked={Boolean(checked[step.id])}
                onChange={() => toggle(step.id)}
              />
              <span>
                <span className="text-copper-300">{i + 1}.</span> {step.label}
              </span>
            </label>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-mist">
          {rows.length} pending · {sentCount} already marked sent for this week
        </p>
        {rows.length > 0 && (
          <button type="button" className="btn-ghost !py-2" onClick={() => void copy(allCopy, "all")}>
            {copied === "all" ? "Copied list" : "Copy all Cash App lines"}
          </button>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="text-mist">No pending payouts. Weeks close after Sunday. Money still goes out in Cash App by you.</p>
      ) : (
        <ul className="divide-y divide-white/10 border border-white/10">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-copper-300">
                  {r.place} · {r.arena} · {r.weekId}
                </p>
                <p>
                  {r.title || "Fan pot"} — {r.artist}
                </p>
                <p className="text-sm text-mist">
                  {r.cashtag} · {r.email} · {formatUsd(r.amountCents)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn-ghost !py-2" onClick={() => void copy(r.cashtag, `${r.id}-tag`)}>
                  {copied === `${r.id}-tag` ? "Copied" : "Copy cashtag"}
                </button>
                <button
                  type="button"
                  className="btn-ghost !py-2"
                  onClick={() => void copy(payoutLine(r), `${r.id}-line`)}
                >
                  {copied === `${r.id}-line` ? "Copied" : "Copy send line"}
                </button>
                <button type="button" className="btn-copper !py-2" onClick={() => void mark(r.id)}>
                  Mark sent
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
