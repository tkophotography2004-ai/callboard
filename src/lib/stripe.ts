import Stripe from "stripe";
import { siteUrl } from "./config";
import { ARENA_LABEL, splitEntry, type Arena } from "./rules";

let client: Stripe | null = null;

export function stripeEnabled() {
  const k = process.env.STRIPE_SECRET_KEY || "";
  return k.startsWith("sk_") && !k.includes("...");
}

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || !stripeEnabled()) throw new Error("STRIPE_SECRET_KEY is not set");
  if (!client) client = new Stripe(key);
  return client;
}

export async function createEntryCheckout(opts: {
  entryId: string;
  userId: string;
  email: string;
  arena: Arena;
  title: string;
}) {
  const stripe = getStripe();
  const split = splitEntry(opts.arena);
  const label = ARENA_LABEL[opts.arena];
  const base = {
    mode: "payment" as const,
    success_url: `${siteUrl()}/api/stripe/complete?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl()}/studio?canceled=1`,
    customer_email: opts.email,
    client_reference_id: opts.userId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd" as const,
          unit_amount: split.entryCents,
          product_data: {
            name: `Callboard · ${label} · ${opts.title}`,
            description:
              opts.arena === "blind"
                ? "Blind talent board. Your name stays off. Keep/Pass ranking only."
                : "Named board. Ranked by Keep/Pass, not clicks. After Stripe and the house cut, the rest goes in the pot.",
          },
        },
      },
    ],
    metadata: {
      product: "entry",
      entryId: opts.entryId,
      userId: opts.userId,
      arena: opts.arena,
    },
  };

  try {
    return await stripe.checkout.sessions.create({
      ...base,
      payment_method_types: ["card", "cashapp"],
    });
  } catch {
    return await stripe.checkout.sessions.create(base);
  }
}
