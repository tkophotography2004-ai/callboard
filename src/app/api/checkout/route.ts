import { json } from "@/lib/api";

/** Entries create their own Stripe session. Kept as a hint for older clients. */
export async function POST() {
  return json({ error: "Submit from /enter." }, 400);
}
