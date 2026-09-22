"use client";

import { useState } from "react";
import Link from "next/link";

export default function AuthForm({ mode, next }: { mode: "login" | "signup"; next?: string }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
      body.paypalEmail = String(data.get("paypalEmail") || "");
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
      <div className="block">
        <span className="eyebrow">Password</span>
        <div className="relative mt-2">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            autoComplete={signup ? "new-password" : "current-password"}
            className="w-full pr-20"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-2 my-auto h-8 rounded px-2 text-xs uppercase tracking-[0.14em] text-copper-300 hover:text-copper-200"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </div>
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
            <span className="eyebrow">Cash App cashtag (optional)</span>
            <input name="cashtag" className="mt-2" placeholder="$YourTag" />
          </label>
          <label className="block">
            <span className="eyebrow">PayPal email (optional)</span>
            <input name="paypalEmail" type="email" className="mt-2" placeholder="you@example.com" />
            <span className="mt-2 block text-xs text-white/40">
              Optional — for winnings. PayPal helps outside the US. You can add or change either later in Studio.
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
