import { isAdmin } from "@/lib/auth";
import { json } from "@/lib/api";
import { updateStore } from "@/lib/store";

export async function POST(req: Request) {
  if (!(await isAdmin())) return json({ error: "Admin only." }, 401);
  const body = (await req.json().catch(() => ({}))) as { live?: boolean };
  const live = Boolean(body.live);
  const result = await updateStore((store) => {
    store.chargesLive = live;
    if (live) {
      store.chargesLiveAt = new Date().toISOString();
      for (const entry of store.entries) {
        const real = Boolean(entry.stripeSessionId && entry.stripeSessionId.startsWith("cs_"));
        if (!real) {
          entry.potCents = 0;
          entry.houseCents = 0;
          entry.feeCents = 0;
        }
      }
      store.houseCents = store.entries.reduce((sum, e) => sum + (e.houseCents || 0), 0);
    } else {
      store.chargesLiveAt = null;
    }
    return { chargesLive: store.chargesLive, chargesLiveAt: store.chargesLiveAt };
  });
  return json({ ok: true, ...result });
}
