"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordForm() {
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");
    setResetUrl("");
    setBusy(true);
    const data = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: String(data.get("email") || "") }),
    });
    const json = (await res.json().catch(() => ({}))) as {
      error?: string;
      message?: string;
      resetUrl?: string;
    };
    setBusy(false);
    if (!res.ok) {
      setError(json.error || "Could not start reset.");
      return;
    }
    setMessage(json.message || "Check your email for a reset link.");
    if (json.resetUrl) setResetUrl(json.resetUrl);
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="mx-auto mt-8 max-w-md space-y-4">
      <label className="block">
        <span className="eyebrow">Email</span>
        <input name="email" type="email" required autoComplete="email" className="mt-2" />
      </label>
      {error && <p className="text-sm text-copper-300">{error}</p>}
      {message && <p className="text-sm text-white/80">{message}</p>}
      {resetUrl && (
        <p className="break-all text-sm text-copper-300">
          Dev echo link: <Link href={resetUrl}>{resetUrl}</Link>
        </p>
      )}
      <button type="submit" disabled={busy} className="btn-copper w-full">
        {busy ? "Please wait…" : "Send reset link"}
      </button>
      <p className="text-center text-sm text-mist">
        <Link href="/login" className="text-copper-300">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
