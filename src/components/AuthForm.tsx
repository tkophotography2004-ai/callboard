"use client";

import { useState } from "react";
import Link from "next/link";

export default function AuthForm({ mode, next }: { mode: "login" | "signup"; next?: string }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const signup = mode === "signup";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const data = new FormData(e.currentTarget);
    const body: Record<string, string> = {
      email: String(data.get("email") || ""),
      password: String(data.get("password") || ""),
    };
    if (signup) {
      body.displayName = String(data.get("displayName") || "");
      body.username = String(data.get("username") || "");
      body.cashtag = String(data.get("cashtag") || "");
    }
    const res = await fetch(signup ? "/api/auth/signup" : "/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(json.error || "Could not continue.");
      return;
    }
    window.location.href = next || "/studio";
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="mx-auto mt-8 max-w-md space-y-4">
      <label className="block">
        <span className="eyebrow">Email</span>
        <input name="email" type="email" required autoComplete="email" className="mt-2" />
      </label>
      <label className="block">
        <span className="eyebrow">Password</span>
        <input name="password" type="password" required minLength={8} autoComplete={signup ? "new-password" : "current-password"} className="mt-2" />
      </label>
      {signup && (
        <>
          <label className="block">
            <span className="eyebrow">Artist / creator name</span>
            <input name="displayName" required maxLength={40} className="mt-2" placeholder="How you want to be credited" />
          </label>
          <label className="block">
            <span className="eyebrow">Username</span>
            <input name="username" required minLength={3} maxLength={20} className="mt-2" placeholder="novavale" />
          </label>
          <label className="block">
            <span className="eyebrow">Cash App cashtag</span>
            <input name="cashtag" required className="mt-2" placeholder="$YourTag" />
            <span className="mt-2 block text-xs text-white/40">
              Winnings are sent here. You can change it later in Studio.
            </span>
          </label>
        </>
      )}
      {error && <p className="text-sm text-copper-300">{error}</p>}
      <button type="submit" disabled={busy} className="btn-copper w-full">
        {busy ? "Please wait…" : signup ? "Create account" : "Sign in"}
      </button>
      <p className="text-center text-sm text-mist">
        {signup ? (
          <>
            Already in? <Link href="/login" className="text-copper-300">Sign in</Link>
          </>
        ) : (
          <>
            New here? <Link href="/signup" className="text-copper-300">Create an account</Link>
          </>
        )}
      </p>
    </form>
  );
}
