import { isResponse, json, requireUser } from "@/lib/api";
import { readArtistLinks } from "@/lib/format";
import { normalizeCashtag, normalizePaypalEmail } from "@/lib/rules";
import { updateStore } from "@/lib/store";
import { EMPTY_LINKS } from "@/lib/types";

export async function POST(req: Request) {
  const user = await requireUser();
  if (isResponse(user)) return user;
  const body = (await req.json().catch(() => ({}))) as Record<string, string>;
  const cashtag = normalizeCashtag(body.cashtag || "");
  const paypalEmail = normalizePaypalEmail(body.paypalEmail || "");
  if (cashtag === null) return json({ error: "Cash App cashtag looks invalid. Use something like $YourName, or leave it blank." }, 400);
  if (paypalEmail === null) return json({ error: "PayPal email looks invalid, or leave it blank." }, 400);
  const links = readArtistLinks(body);
  await updateStore((store) => {
    const row = store.users.find((u) => u.id === user.id);
    if (row) {
      row.cashtag = cashtag;
      row.paypalEmail = paypalEmail;
      row.links = { ...EMPTY_LINKS, ...links };
    }
  });
  return json({ ok: true, cashtag, paypalEmail, links });
}
