"use client";

import { useEffect, useState } from "react";

const URL_ = "https://scrollcalllive.com/join?ref=fanpot";
const TEXT = "I just joined the Scroll Call fan pot — fans vote free, winners get paid weekly.";

export default function ShareFanPot() {
  const [canShare, setCanShare] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  async function nativeShare() {
    try {
      await navigator.share({ title: "Scroll Call Fan Pot", text: TEXT, url: URL_ });
    } catch {
      /* dismissed */
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(URL_);
    } catch {
      const t = document.createElement("textarea");
      t.value = URL_;
      document.body.appendChild(t);
      t.select();
      document.execCommand("copy");
      t.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const u = encodeURIComponent(URL_);
  const msg = encodeURIComponent(`${TEXT} ${URL_}`);
  const links = [
    { label: "X", href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(TEXT)}&url=${u}` },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { label: "WhatsApp", href: `https://wa.me/?text=${msg}` },
    { label: "Text", href: `sms:?&body=${msg}` },
  ];

  return (
    <div className="mt-8 space-y-3">
      {canShare && (
        <button type="button" onClick={() => void nativeShare()} className="btn-copper h-12 w-full">
          Share Scroll Call
        </button>
      )}
      <button type="button" onClick={() => void copy()} className={`${canShare ? "btn-ghost" : "btn-copper"} h-12 w-full`}>
        {copied ? "Link copied" : "Copy link"}
      </button>
      <div className="grid grid-cols-2 gap-3">
        {links.map((l) => (
          <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className="btn-ghost h-12 !px-3">
            {l.label}
          </a>
        ))}
      </div>
      <p className="break-all text-center text-xs text-mist">{URL_}</p>
    </div>
  );
}
