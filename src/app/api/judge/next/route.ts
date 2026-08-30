import { json, clientIp } from "@/lib/api";
import { liveEntries, scoutTotal } from "@/lib/ranking";
import { isArena } from "@/lib/rules";
import { readStore } from "@/lib/store";
import { getOrCreateVoterId, hashIp } from "@/lib/voter";
import { isoWeekId } from "@/lib/week";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const raw = url.searchParams.get("arena") || "blind";
  const arena = isArena(raw) ? raw : "blind";
  const voterId = await getOrCreateVoterId();
  const ipHash = hashIp(clientIp(req));
  const store = await readStore();
  const weekId = isoWeekId();
  const judged = new Set(
    store.votes
      .filter((v) => v.kind === "scout" && (v.voterId === voterId || v.ipHash === ipHash))
      .map((v) => v.entryId),
  );
  const pool = liveEntries(store, arena, weekId).filter((e) => !judged.has(e.id));
  if (!pool.length) {
    return json({ error: "You have judged every live cut on this board. Come back when new entries land." });
  }
  pool.sort((a, b) => scoutTotal(a) - scoutTotal(b) || Math.random() - 0.5);
  const pick = pool[0];
  return json({
    entry: {
      id: pick.id,
      arena: pick.arena,
      screenKind: pick.screenKind,
      genre: pick.genre,
      coverPath: pick.coverPath,
      mediaPath: pick.mediaPath,
      durationSeconds: pick.durationSeconds,
      hookStartSeconds: pick.hookStartSeconds,
      remaining: pool.length,
    },
  });
}
