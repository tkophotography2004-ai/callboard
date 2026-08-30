import { markEntryPaid } from "@/lib/money";
import { getStripe, stripeEnabled } from "@/lib/stripe";
import { updateStore } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!stripeEnabled()) return new Response("stripe off", { status: 200 });
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const body = await req.text();
  let event;
  try {
    if (secret) {
      const sig = req.headers.get("stripe-signature") || "";
      event = stripe.webhooks.constructEvent(body, sig, secret);
    } else {
      event = JSON.parse(body);
    }
  } catch {
    return new Response("bad signature", { status: 400 });
  }
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as { id: string; payment_status?: string; metadata?: { entryId?: string } };
    if (session.payment_status === "paid" || session.payment_status === "no_payment_required") {
      const entryId = session.metadata?.entryId;
      if (entryId) {
        await updateStore((store) => {
          const entry = store.entries.find((e) => e.id === entryId);
          if (entry && entry.status !== "paid") {
            markEntryPaid(store, entry, session.id);
          }
        });
      }
    }
  }
  return new Response("ok", { status: 200 });
}
