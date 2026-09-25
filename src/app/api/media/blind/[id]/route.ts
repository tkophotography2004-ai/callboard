import { blindAudioResponse } from "@/lib/blindAudio";
import { readStore } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Blind audio by entry id. Streams from private storage; the browser never learns the
 * blob path, original filename, or anything else about the upload.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[A-Za-z0-9_-]{1,40}$/.test(id || "")) return new Response("Not found", { status: 404 });
  const store = await readStore();
  const entry = store.entries.find((e) => e.id === id && e.arena === "blind" && e.status === "paid");
  if (!entry?.audio?.key) return new Response("Not found", { status: 404 });
  try {
    return await blindAudioResponse(entry.audio, req.headers.get("range"));
  } catch (err) {
    console.error("blind audio stream failed", err instanceof Error ? err.message : String(err));
    return new Response("Audio unavailable", { status: 502 });
  }
}
