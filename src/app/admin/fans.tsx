"use client";

import { useState } from "react";

export type FanRow = {
  id: string;
  firstName: string;
  email: string;
  status: string;
  createdAt: string;
  ref: string;
  test: boolean;
};

export default function AdminFans({ rows }: { rows: FanRow[] }) {
  const [list, setList] = useState(rows);
  const [busy, setBusy] = useState("");

  async function act(id: string, action: "delete" | "test" | "untest") {
    if (action === "delete" && !confirm("Delete this fan contact?")) return;
    setBusy(id);
    const res = await fetch("/api/admin/fans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    setBusy("");
    if (!res.ok) return;
    setList((cur) =>
      action === "delete" ? cur.filter((r) => r.id !== id) : cur.map((r) => (r.id === id ? { ...r, test: action === "test" } : r)),
    );
  }

  if (list.length === 0) return <p className="mt-4 text-sm text-mist">No fans yet.</p>;
  return (
    <ul className="mt-5 divide-y divide-white/10">
      {list.map((f) => (
        <li key={f.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-baseline sm:justify-between">
          <div className="min-w-0">
            <p className="text-paper">
              {f.firstName}{" "}
              {f.test && <span className="ml-1 text-[10px] uppercase tracking-[0.16em] text-copper-300">test</span>}
            </p>
            <p className="break-all text-sm text-mist">
              {f.email} · {f.ref ? `ref ${f.ref}` : "no ref"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.16em]">
            <span className={f.status === "confirmed" ? "text-copper-300" : "text-white/40"}>{f.status}</span>
            <span className="text-white/40">{new Date(f.createdAt).toLocaleString()}</span>
            <button
              type="button"
              disabled={busy === f.id}
              className="text-mist hover:text-copper-200"
              onClick={() => void act(f.id, f.test ? "untest" : "test")}
            >
              {f.test ? "Unmark test" : "Mark test"}
            </button>
            <button
              type="button"
              disabled={busy === f.id}
              className="text-mist hover:text-copper-200"
              onClick={() => void act(f.id, "delete")}
            >
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
