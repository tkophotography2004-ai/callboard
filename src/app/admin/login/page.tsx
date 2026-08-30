"use client";

import { useState } from "react";

export default function AdminLoginPage() {
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const password = String(new FormData(e.currentTarget).get("password") || "");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "No.");
      return;
    }
    window.location.href = "/admin";
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-24">
      <h1 className="display text-4xl">House key</h1>
      <form onSubmit={(e) => void onSubmit(e)} className="mt-8 space-y-4">
        <input name="password" type="password" required placeholder="Password" />
        {error && <p className="text-sm text-copper-300">{error}</p>}
        <button className="btn-copper w-full" type="submit">
          Enter
        </button>
      </form>
    </div>
  );
}
