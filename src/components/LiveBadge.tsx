import Link from "next/link";
import { namedLoungesAreFree, namedPriceLine } from "@/lib/rules";

export default function LiveBadge({
  live,
  href,
  size = "sm",
}: {
  live: boolean;
  href?: string;
  size?: "sm" | "lg";
}) {
  const cls = `${live ? "live-glow" : "live-off"} ${size === "lg" ? "!px-5 !py-3 !text-[12px]" : ""}`;
  const label = live
    ? namedLoungesAreFree()
      ? "Pot is live - Blind $30 - named lounges free"
      : `Pot is live - Blind $30 - ${namedPriceLine()}`
    : "Pot is off - free to submit";
  const inner = (
    <>
      <span className="live-dot" aria-hidden />
      {label}
    </>
  );
  if (href) {
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    );
  }
  return <span className={cls}>{inner}</span>;
}