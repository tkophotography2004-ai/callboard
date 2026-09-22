"use client";

import { useState } from "react";
import type { ArtistLinks } from "@/lib/types";

export default function StudioClient({
  cashtag,
  links,
}: {
  cashtag: string;
  links: ArtistLinks;
}) {
  const [value, setValue] = useState(cashtag);
  const [socials, setSocials] = useState(links);
  const [msg, setMsg] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cashtag: value, ...socials }),
    });
    const data = await res.json();
    setMsg(data.error || "Saved.");
    if (data.cashtag) setValue(data.cashtag);
    if (data.links) setSocials(data.links);
  }

  return (
    <form onSubmit={(e) => void save(e)} className="mt-8 space-y-6 border border-white/10 p-5">
      <div>
        <p className="eyebrow">Cash App</p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="$YourTag" />
          <button className="btn-ghost shrink-0" type="submit">
            Save
          </button>
        </div>
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
      {msg && <p className="text-sm text-mist">{msg}</p>}
    </form>
  );
}
