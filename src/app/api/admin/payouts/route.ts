import { isAdmin } from "@/lib/auth";
import { json } from "@/lib/api";
import { updateStore } from "@/lib/store";

export async function POST(req: Request) {
  if (!(await isAdmin())) return json({ error: "Admin only." }, 401);
  const body = (await req.json().catch(() => ({}))) as { id?: string; status?: "sent" | "void" };
  if (!body.id) return json({ error: "Missing payout." }, 400);
  await updateStore((store) => {
    const row = store.payouts.find((p) => p.id === body.id);
    if (!row) throw new Error("No payout.");
    row.status = body.status === "void" ? "void" : "sent";
    row.sentAt = new Date().toISOString();
  });
  return json({ ok: true });
}
