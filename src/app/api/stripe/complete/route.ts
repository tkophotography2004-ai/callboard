import { NextResponse } from "next/server";
import { markEntryPaid } from "@/lib/money";
import { getStripe, stripeEnabled } from "@/lib/stripe";
import { updateStore } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("session_id");
  const success = new URL("/success", req.url);
  success.searchParams.set("paid", "1");
  if (!sessionId || !stripeEnabled()) {
    return NextResponse.redirect(new URL("/studio", req.url));
  }

  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid" && session.status !== "complete") {
      return NextResponse.redirect(new URL("/studio?paid=0", req.url));
    }
    const entryId = session.metadata?.entryId;
    let passCode: string | null = null;
    if (entryId) {
      await updateStore((store) => {
        const entry = store.entries.find((e) => e.id === entryId);
        if (entry) {
          if (entry.status !== "paid") {
            const paid = markEntryPaid(store, entry, session.id);
            passCode = paid.passCode;
          }
          if (entry.slug) success.searchParams.set("slug", entry.slug);
          if (entry.arena) success.searchParams.set("arena", entry.arena);
          if (entry.title && entry.arena !== "blind") success.searchParams.set("title", entry.title);
        }
      });
    }
    if (passCode) {
      success.searchParams.set("pass", "1");
      success.searchParams.set("code", passCode);
    }
    return NextResponse.redirect(success);
  } catch {
    return NextResponse.redirect(new URL("/studio", req.url));
  }
}
