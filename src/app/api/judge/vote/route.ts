import { nanoid } from "nanoid";
import { clientIp, json } from "@/lib/api";
import { keepRate, scoutTotal } from "@/lib/ranking";
import { updateStore } from "@/lib/store";
import { getOrCreateVoterId, hashIp } from "@/lib/voter";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { entryId?: string; keep?: boolean };
  const entryId = body.entryId || "";
  const keep = Boolean(body.keep);
  const voterId = await getOrCreateVoterId();
  const ipHash = hashIp(clientIp(req));

  const result = await updateStore((store) => {
    const entry = store.entries.find((e) => e.id === entryId && e.status === "paid");
    if (!entry) throw new Error("That cut is gone.");
    const already = store.votes.find(
      (v) => v.kind === "scout" && v.entryId === entryId && (v.voterId === voterId || v.ipHash === ipHash),
    );
    if (already) throw new Error("You already judged this one.");
    store.votes.push({
      id: `v_${nanoid(10)}`,
      entryId,
      kind: "scout",
      keep,
      voterId,
      ipHash,
      createdAt: new Date().toISOString(),
    });
    if (keep) entry.scoutKeeps += 1;
    else entry.scoutPasses += 1;
    const user = store.users.find((u) => u.id === entry.userId);
    const hide = entry.arena === "blind";
    return {
      keep,
      title: hide ? "Anonymous cut" : entry.title,
      artist: hide ? "Hidden until the week closes" : user?.displayName || "Unknown",
      slug: entry.slug,
      keepPct: keepRate(entry),
      sample: scoutTotal(entry),
      hidden: hide,
    };
  }).catch((err: Error) => err);

  if (result instanceof Error) return json({ error: result.message }, 400);
  return json(result);
}
