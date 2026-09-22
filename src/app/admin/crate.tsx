"use client";

import { useState } from "react";

export default function AdminCrate({ count }: { count: number }) {
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function send() {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/crate", { method: "POST" });
      const data = (await res.json()) as { error?: string; sent?: number; results?: { code?: string; title?: string }[] };
      if (!res.ok) {
        setMsg(data.error || "Crate did not take the winners.");
        return;
      }
      const codes = (data.results || [])
        .map((r) => (r.code ? `${r.title || "cut"} · ${r.code}` : ""))
        .filter(Boolean)
        .join(" · ");
      setMsg(`Sent ${data.sent} to Crate.${codes ? ` ${codes}` : ""}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-8 border border-copper-400/30 bg-black/20 p-5">
      <p className="eyebrow">Crate playlists</p>
      <h2 className="display mt-2 text-3xl">Send winners</h2>
      <p className="mt-2 text-sm text-mist">
        Crate is a separate app. Crowned music cuts add free there. Everyone else pays Crate to get on a list. {count}{" "}
        closed-week cuts are ready.
      </p>
      <button type="button" className="btn-copper mt-4" onClick={send} disabled={busy || count === 0}>
        {busy ? "Sending…" : "Send winners to Crate"}
      </button>
      {msg && <p className="mt-3 text-sm text-copper-200">{msg}</p>}
    </div>
  );
}
