"use client";

import { useState } from "react";
import Link from "next/link";

export default function ResetPasswordForm({ token }: { token: string }) {
  const [error, setError] = useState(token ? "" : "Open the link from your email to reset.");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) {
      setError("Open the link from your email to reset.");
      return;
    }
    setError("");
    setBusy(true);
    const data = new FormData(e.currentTarget);
    const password = String(data.get("password") || "");
    const confirm = String(data.get("confirm") || "");
    if (password !== confirm) {
      setBusy(false);
      setError("Passwords do not match.");
      return;
    }
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(json.error || "Could not reset password.");
      return;
    }
    window.location.href = "/studio";
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="mx-auto mt-8 max-w-md space-y-4">
      <div className="block">
        <span className="eyebrow">New password</span>
        <div className="relative mt-2">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full pr-20"
            disabled={!token}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-2 my-auto h-8 rounded px-2 text-xs uppercase tracking-[0.14em] text-copper-300 hover:text-copper-200"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </div>
      <label className="block">
        <span className="eyebrow">Confirm password</span>
        <input
          name="confirm"
          type={showPassword ? "text" : "password"}
          required
          minLength={8}
          autoComplete="new-password"
          className="mt-2"
          disabled={!token}
        />
      </label>
      {error && <p className="text-sm text-copper-300">{error}</p>}
      <button type="submit" disabled={busy || !token} className="btn-copper w-full">
        {busy ? "Please wait…" : "Save new password"}
      </button>
      <p className="text-center text-sm text-mist">
        <Link href="/forgot-password" className="text-copper-300">
          Request a new link
        </Link>
        {" · "}
        <Link href="/login" className="text-copper-300">
          Sign in
        </Link>
      </p>
    </form>
  );
}
