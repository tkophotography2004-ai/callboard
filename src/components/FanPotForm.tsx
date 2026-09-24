"use client";

import { useState } from "react";

export default function FanPotForm({ refCode }: { refCode: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [already, setAlready] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const data = new FormData(e.currentTarget);
    const body = {
      firstName: String(data.get("firstName") || ""),
      email: String(data.get("email") || ""),
      website: String(data.get("website") || ""),
      ref: String(data.get("ref") || ""),
    };
    setBusy(true);
    const res = await fetch("/api/fanpot/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => null);
    const json = res ? await res.json().catch(() => ({})) : {};
    setBusy(false);
    if (!res || !res.ok) {
      setError(json.error || "Could not sign you up. Try again.");
      return;
    }
    if (json.already) setAlready(true);
    setSentTo(body.email.trim());
  }

  if (sentTo) {
    return (
      <div className="mt-8 border border-copper-400/60 bg-copper-400/10 p-5" role="status">
        {already ? (
          <>
            <p className="display text-2xl text-paper">You&apos;re already in.</p>
            <p className="mt-2 text-mist">{sentTo} is on the fan pot list. Go vote — it&apos;s free.</p>
            <a href="/" className="btn-copper mt-5 flex h-12 w-full">
              Go vote now
            </a>
          </>
        ) : (
          <>
            <p className="display text-2xl text-paper">Check your email.</p>
            <p className="mt-2 text-mist">
              We sent a confirm link to <span className="break-all text-paper">{sentTo}</span>. Tap &quot;Yes, count me
              in&quot; to finish. Not there? Check spam or promotions.
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} action="/api/fanpot/join" method="post" className="mt-8 space-y-4">
      <label className="block">
        <span className="eyebrow">First name</span>
        <input
          name="firstName"
          type="text"
          required
          maxLength={40}
          autoComplete="given-name"
          className="mt-2 h-12 text-base"
        />
      </label>
      <label className="block">
        <span className="eyebrow">Email</span>
        <input
          name="email"
          type="email"
          required
          inputMode="email"
          autoComplete="email"
          className="mt-2 h-12 text-base"
        />
      </label>
      {/* Honeypot: hidden from people, bots fill it. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input name="website" type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <input type="hidden" name="ref" value={refCode} />
      {error && (
        <p className="text-sm text-copper-300" role="alert">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy} className="btn-copper h-12 w-full text-[13px] disabled:opacity-60">
        {busy ? "Sending…" : "Count me in"}
      </button>
      <p className="text-xs leading-relaxed text-mist">
        Free to join. No purchase necessary. We&apos;ll email you a confirm link, then weekly winners. Unsubscribe
        anytime. By joining you agree to the{" "}
        <a href="/terms" className="text-copper-300 underline underline-offset-2 hover:text-copper-200">
          Terms
        </a>
        .
      </p>
    </form>
  );
}
