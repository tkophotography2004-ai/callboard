"use client";

import { useState } from "react";

export default function AdminCharges({ live }: { live: boolean }) {
  const [busy, setBusy] = useState(false);
  const [on, setOn] = useState(live);

  async function flip(next: boolean) {
    const msg = next
      ? "Turn the pot ON? Stripe will charge $30 for Blind and $5 launch ($10 regular) for the other lounges. Founding entries already on the board stay, but they do not add cash."
      : "Turn the pot OFF? New entries will be free again. No new prize money will be collected until you turn it back on.";
    if (!window.confirm(msg)) return;
    setBusy(true);
    const res = await fetch("/api/admin/charges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ live: next }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      window.alert(data.error || "Could not update.");
      return;
    }
    setOn(Boolean(data.chargesLive));
    window.location.reload();
  }

  return (
    <div className={`mt-8 border p-6 ${on ? "border-copper-400/50" : "border-white/15"}`}>
      <p className="eyebrow">{on ? "Pot is live" : "Pot is off"}</p>
      <h2 className="display mt-2 text-3xl">{on ? "Charges are on" : "Gathering the board"}</h2>
      <p className="mt-3 max-w-xl text-sm text-mist">
        {on
          ? "Stripe is collecting $30 Blind (music) and $5 launch ($10 regular) for Music / Film / Music Video / Creator. Flip this off if you need to pause money."
          : "People can still sign up, submit, and judge for free. No Stripe charge. No prize money. Turn this on when enough artists are in and you want the cash pot to start."}
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={() => void flip(!on)}
        className={`mt-6 ${on ? "btn-ghost" : "btn-copper"}`}
      >
        {busy ? "Saving…" : on ? "Turn pot off" : "Turn pot & charges on"}
      </button>
    </div>
  );
}
