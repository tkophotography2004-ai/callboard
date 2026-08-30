"use client";

import { useState } from "react";

export default function StudioClient({ cashtag }: { cashtag: string }) {
  const [value, setValue] = useState(cashtag);
  const [msg, setMsg] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cashtag: value }),
    });
    const data = await res.json();
    setMsg(data.error || "Cashtag saved.");
    if (data.cashtag) setValue(data.cashtag);
  }

  return (
    <form onSubmit={(e) => void save(e)} className="mt-8 border border-white/10 p-5">
      <p className="eyebrow">Cash App</p>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="$YourTag" />
        <button className="btn-ghost shrink-0" type="submit">
          Save
        </button>
      </div>
      {msg && <p className="mt-3 text-sm text-mist">{msg}</p>}
    </form>
  );
}
