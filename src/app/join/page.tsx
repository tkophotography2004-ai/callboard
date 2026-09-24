import type { Metadata } from "next";
import FanPotForm from "@/components/FanPotForm";
import { cleanRef, fanPotLabel, FANPOT_SHARE_URL } from "@/lib/fanpot";
import { FAN_POT_SEED_CENTS, formatUsd } from "@/lib/rules";
import { readStore } from "@/lib/store";

export const metadata: Metadata = {
  title: "Join the Fan Pot",
  description: "Fans vote free, winners get paid weekly. Free to join. No purchase necessary.",
  openGraph: {
    title: "Join the Fan Pot — Scroll Call®",
    description: "Fans vote free, winners get paid weekly. Free to join.",
    url: FANPOT_SHARE_URL,
    images: ["/seed/hero.jpg"],
  },
};

export const dynamic = "force-dynamic";

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; sent?: string; expired?: string; invalid?: string; already?: string; error?: string }>;
}) {
  const sp = await searchParams;
  let pot = formatUsd(FAN_POT_SEED_CENTS);
  try {
    pot = fanPotLabel(await readStore());
  } catch {
    /* show seed */
  }
  const notice = sp.sent
    ? "Check your email for the confirm link."
    : sp.already
      ? "You're already in the fan pot."
      : sp.expired
        ? "That confirm link expired. Enter your email again and we'll send a fresh one."
        : sp.invalid
          ? "That link didn't work. Enter your email again and we'll send a fresh one."
          : sp.error
            ? "Something went wrong. Try again in a minute."
            : "";

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:py-16">
      <p className="eyebrow">Fan Pot · Beta</p>
      <h1 className="display mt-3 text-4xl leading-tight sm:text-5xl">
        Join the Fan Pot — Fans vote free, winners get paid weekly
      </h1>
      <div className="mt-6 space-y-3 text-[15px] leading-relaxed text-mist">
        <p>
          The fan pot is <strong className="text-paper">{pot}</strong> right now, and it grows as the board fills.
        </p>
        <p>Fans vote free — Keep or Pass. Weekly winners are crowned every week.</p>
        <p className="text-paper">Free to join. No purchase necessary.</p>
      </div>
      {notice && <p className="mt-6 border border-white/15 p-4 text-sm text-paper">{notice}</p>}
      <FanPotForm refCode={cleanRef(sp.ref || "")} />
    </div>
  );
}
