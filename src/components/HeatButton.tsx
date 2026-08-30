"use client";

import { useState } from "react";

export default function HeatButton({ entryId, initial }: { entryId: string; initial: number }) {
  const [count, setCount] = useState(initial);
  const [done, setDone] = useState(false);
  const [msg, setMsg] = useState("");

  async function vote() {
    if (done) return;
    const res = await fetch("/api/heat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entryId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || "Could not vote.");
      setDone(true);
      return;
    }
    setCount(data.heatVotes);
    setDone(true);
    setMsg("Share counted. It does not change The Cut. Keep / Pass is how cash is decided.");
  }

  return (
    <div>
      <button type="button" onClick={() => void vote()} disabled={done} className="btn-copper disabled:opacity-60">
        Share {count}
      </button>
      {msg && <p className="mt-3 text-sm text-mist">{msg}</p>}
    </div>
  );
}
