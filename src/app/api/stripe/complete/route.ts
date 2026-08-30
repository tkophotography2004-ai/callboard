import { NextResponse } from "next/server";
import { markEntryPaid } from "@/lib/money";
import { getStripe, stripeEnabled } from "@/lib/stripe";
import { updateStore } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("session_id");
  const studio = new URL("/studio?paid=1", req.url);
  if (!sessionId || !stripeEnabled()) {
    return NextResponse.redirect(new URL("/studio", req.url));
  }

  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid" && session.status !== "complete") {
      return NextResponse.redirect(new URL("/studio?paid=0", req.url));
    }
    const entryId = session.metadata?.entryId;
    if (entryId) {
      await updateStore((store) => {
        const entry = store.entries.find((e) => e.id === entryId);
        if (entry && entry.status !== "paid") {
          markEntryPaid(store, entry, session.id);
        }
      });
    }
    return NextResponse.redirect(studio);
  } catch {
    return NextResponse.redirect(new URL("/studio", req.url));
  }
}
