import { isAdmin } from "@/lib/auth";
import { json } from "@/lib/api";
import { fansCsv } from "@/lib/fanpot";
import { readStore, updateStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return json({ error: "Admin only." }, 401);
  const store = await readStore();
  const fans = [...(store.fans || [])].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const day = new Date().toISOString().slice(0, 10);
  return new Response(fansCsv(fans), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="scroll-call-fans-${day}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return json({ error: "Admin only." }, 401);
  const body = (await req.json().catch(() => ({}))) as { id?: string; action?: "delete" | "test" | "untest" };
  if (!body.id) return json({ error: "Missing fan." }, 400);
  const ok = await updateStore((store) => {
    const fans = store.fans || [];
    const i = fans.findIndex((f) => f.id === body.id);
    if (i < 0) return false;
    if (body.action === "delete") fans.splice(i, 1);
    else fans[i].test = body.action !== "untest";
    return true;
  });
  return ok ? json({ ok: true }) : json({ error: "No such fan." }, 404);
}
