"use client";

import { useState } from "react";

export default function StudioClient({
  cashtag,
  paypalEmail,
}: {
  cashtag: string;
  paypalEmail: string;
}) {
  const [cash, setCash] = useState(cashtag);
  const [paypal, setPaypal] = useState(paypalEmail);
  const [msg, setMsg] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cashtag: cash, paypalEmail: paypal }),
    });
    const data = await res.json();
    setMsg(data.error || "Payout details saved.");
    if (typeof data.cashtag === "string") setCash(data.cashtag);
    if (typeof data.paypalEmail === "string") setPaypal(data.paypalEmail);
  }

  return (
    <form onSubmit={(e) => void save(e)} className="mt-8 border border-white/10 p-5">
      <p className="eyebrow">Payout methods</p>
      <p className="mt-2 text-sm text-mist">Optional. Cash App or PayPal for winnings — PayPal helps outside the US.</p>
      <label className="mt-4 block">
        <span className="text-[11px] uppercase tracking-[0.16em] text-white/40">Cash App cashtag</span>
        <input
          value={cash}
          onChange={(e) => setCash(e.target.value)}
          placeholder="$YourTag"
          className="mt-2"
        />
      </label>
      <label className="mt-4 block">
        <span className="text-[11px] uppercase tracking-[0.16em] text-white/40">PayPal email</span>
        <input
          value={paypal}
          onChange={(e) => setPaypal(e.target.value)}
          placeholder="you@example.com"
          type="email"
          className="mt-2"
        />
      </label>
      <button className="btn-ghost mt-4" type="submit">
        Save
      </button>
      {msg && <p className="mt-3 text-sm text-mist">{msg}</p>}
    </form>
  );
}
