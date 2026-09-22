"use client";

import { useState } from "react";
import type { ArtistLinks } from "@/lib/types";

export default function StudioClient({
  cashtag,
  paypalEmail,
  links,
}: {
  cashtag: string;
  paypalEmail: string;
  links: ArtistLinks;
}) {
  const [cash, setCash] = useState(cashtag);
  const [paypal, setPaypal] = useState(paypalEmail);
  const [socials, setSocials] = useState(links);
  const [msg, setMsg] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cashtag: cash, paypalEmail: paypal, ...socials }),
    });
    const data = await res.json();
    setMsg(data.error || "Saved.");
    if (typeof data.cashtag === "string") setCash(data.cashtag);
    if (typeof data.paypalEmail === "string") setPaypal(data.paypalEmail);
    if (data.links) setSocials(data.links);
  }

  return (
    <form onSubmit={(e) => void save(e)} className="mt-8 space-y-6 border border-white/10 p-5">
      <div>
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
      </div>
      <div>
        <p className="eyebrow">Your socials — shown if you land a featured fan spot</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input
            value={socials.instagram}
            onChange={(e) => setSocials({ ...socials, instagram: e.target.value })}
            placeholder="Instagram"
          />
          <input
            value={socials.tiktok}
            onChange={(e) => setSocials({ ...socials, tiktok: e.target.value })}
            placeholder="TikTok"
          />
          <input
            value={socials.facebook || ""}
            onChange={(e) => setSocials({ ...socials, facebook: e.target.value })}
            placeholder="Facebook"
          />
          <input
            value={socials.youtube}
            onChange={(e) => setSocials({ ...socials, youtube: e.target.value })}
            placeholder="YouTube"
          />
          <input
            value={socials.spotify}
            onChange={(e) => setSocials({ ...socials, spotify: e.target.value })}
            placeholder="Spotify"
          />
          <input
            value={socials.appleMusic}
            onChange={(e) => setSocials({ ...socials, appleMusic: e.target.value })}
            placeholder="Apple Music"
          />
          <input
            value={socials.other}
            onChange={(e) => setSocials({ ...socials, other: e.target.value })}
            placeholder="Other link"
          />
        </div>
      </div>
      <button className="btn-ghost" type="submit">
        Save
      </button>
      {msg && <p className="text-sm text-mist">{msg}</p>}
    </form>
  );
}
