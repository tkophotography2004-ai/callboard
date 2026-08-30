import { isResponse, json, requireUser } from "@/lib/api";
import { normalizeCashtag } from "@/lib/rules";
import { updateStore } from "@/lib/store";

export async function POST(req: Request) {
  const user = await requireUser();
  if (isResponse(user)) return user;
  const body = (await req.json().catch(() => ({}))) as { cashtag?: string };
  const cashtag = normalizeCashtag(body.cashtag || "");
  if (!cashtag) return json({ error: "Enter a valid cashtag like $YourName." }, 400);
  await updateStore((store) => {
    const row = store.users.find((u) => u.id === user.id);
    if (row) row.cashtag = cashtag;
  });
  return json({ ok: true, cashtag });
}
