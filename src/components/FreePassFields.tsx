"use client";

import { useState } from "react";

export default function FreePassFields({ freePasses, mustPay }: { freePasses: number; mustPay: boolean }) {
  const [usePass, setUsePass] = useState(false);
  const [passCode, setPassCode] = useState("");
  if (!mustPay) return null;
  return (
    <div className="space-y-3 border border-white/10 p-4">
      <p className="eyebrow">Free submission</p>
      {freePasses > 0 && (
        <label className="flex items-center gap-3 text-sm text-paper">
          <input
            type="checkbox"
            name="useFreePass"
            value="1"
            checked={usePass && !passCode.trim()}
            onChange={(e) => {
              setUsePass(e.target.checked);
              if (e.target.checked) setPassCode("");
            }}
            disabled={Boolean(passCode.trim())}
          />
          Use a free pass on this account ({freePasses} left) — no charge this time
        </label>
      )}
      <label className="block">
        <span className="text-[11px] uppercase tracking-[0.16em] text-white/40">
          Or paste a free-pass code (SC-XXXXXX)
        </span>
        <input
          name="passCode"
          value={passCode}
          onChange={(e) => {
            setPassCode(e.target.value.toUpperCase());
            if (e.target.value.trim()) setUsePass(false);
          }}
          className="mt-2 font-mono tracking-wider"
          placeholder="SC-XXXXXX"
          autoComplete="off"
          spellCheck={false}
        />
      </label>
    </div>
  );
}
