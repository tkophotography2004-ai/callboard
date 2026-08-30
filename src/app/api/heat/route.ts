import { nanoid } from "nanoid";
import { clientIp, json } from "@/lib/api";
import { updateStore } from "@/lib/store";
import { getOrCreateVoterId, hashIp } from "@/lib/voter";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { entryId?: string };
  const entryId = body.entryId || "";
  const voterId = await getOrCreateVoterId();
  const ipHash = hashIp(clientIp(req));

  const result = await updateStore((store) => {
    const entry = store.entries.find((e) => e.id === entryId && e.status === "paid");
    if (!entry) throw new Error("That cut is gone.");
    if (entry.arena === "blind") throw new Error("Blind has no Heat. Clicks cannot buy that pot.");
    const already = store.votes.find(
      (v) => v.kind === "heat" && v.entryId === entryId && (v.voterId === voterId || v.ipHash === ipHash),
    );
    if (already) throw new Error("You already added Heat to this one.");
    store.votes.push({
      id: `v_${nanoid(10)}`,
      entryId,
      kind: "heat",
      keep: true,
      voterId,
      ipHash,
      createdAt: new Date().toISOString(),
    });
    entry.heatVotes += 1;
    return { heatVotes: entry.heatVotes };
  }).catch((err: Error) => err);

  if (result instanceof Error) return json({ error: result.message }, 400);
  return json(result);
}
