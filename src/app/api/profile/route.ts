import { isResponse, json, requireUser } from "@/lib/api";
import { normalizeCashtag, normalizePaypalEmail } from "@/lib/rules";
import { updateStore } from "@/lib/store";

export async function POST(req: Request) {
  const user = await requireUser();
  if (isResponse(user)) return user;
  const body = (await req.json().catch(() => ({}))) as {
    cashtag?: string;
    paypalEmail?: string;
  };

  const cashtagProvided = Object.prototype.hasOwnProperty.call(body, "cashtag");
  const paypalProvided = Object.prototype.hasOwnProperty.call(body, "paypalEmail");

  let nextCashtag = user.cashtag || "";
  let nextPaypal = user.paypalEmail || "";

  if (cashtagProvided) {
    const cashtag = normalizeCashtag(body.cashtag || "");
    if (cashtag === null) return json({ error: "Enter a valid cashtag like $YourName." }, 400);
    nextCashtag = cashtag;
  }
  if (paypalProvided) {
    const paypalEmail = normalizePaypalEmail(body.paypalEmail || "");
    if (paypalEmail === null) return json({ error: "Enter a valid PayPal email." }, 400);
    nextPaypal = paypalEmail;
  }

  await updateStore((store) => {
    const row = store.users.find((u) => u.id === user.id);
    if (row) {
      row.cashtag = nextCashtag;
      row.paypalEmail = nextPaypal;
    }
  });
  return json({ ok: true, cashtag: nextCashtag, paypalEmail: nextPaypal });
}
