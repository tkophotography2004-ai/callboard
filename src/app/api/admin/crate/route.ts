import { json } from "@/lib/api";
import { isAdmin } from "@/lib/auth";
import { collectCrateWinners, crateUrl, pushWinnersToCrate } from "@/lib/crate";
import { readStore } from "@/lib/store";

export const runtime = "nodejs";

export async function GET() {
  if (!(await isAdmin())) return json({ error: "Admin only." }, 401);
  const store = await readStore();
  return json({ crateUrl: crateUrl(), winners: collectCrateWinners(store) });
}

export async function POST() {
  if (!(await isAdmin())) return json({ error: "Admin only." }, 401);
  const store = await readStore();
  const winners = collectCrateWinners(store);
  if (!winners.length) return json({ error: "No crowned music cuts to send yet." }, 400);
  try {
    const result = await pushWinnersToCrate(winners);
    return json({ ok: true, sent: winners.length, crateUrl: crateUrl(), ...result });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Push failed." }, 502);
  }
}
