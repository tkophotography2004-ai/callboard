import type { Metadata } from "next";
import ShareFanPot from "@/components/ShareFanPot";

export const metadata: Metadata = { title: "You're in!" };

export default function ConfirmedPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:py-16">
      <p className="eyebrow">Fan Pot</p>
      <h1 className="display mt-3 text-5xl">You&apos;re in!</h1>
      <p className="mt-4 text-[15px] leading-relaxed text-mist">
        Welcome to Scroll Call. Check your inbox for a welcome note. Fans vote free, and winners are crowned every
        week. Bring a friend — the more fans, the bigger the moment.
      </p>
      <ShareFanPot />
      <a href="/" className="btn-ghost mt-4 flex h-12 w-full">
        Go vote now
      </a>
    </div>
  );
}
