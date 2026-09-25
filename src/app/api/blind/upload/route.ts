import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { isResponse, json, requireUser } from "@/lib/api";
import { BLIND_AUDIO_MAX_BYTES, BLIND_AUDIO_MIME, BLIND_INCOMING_PREFIX } from "@/lib/blind";
import { blobEnabled, saveLocalIncoming } from "@/lib/blindAudio";
import { PUBLIC_CLOSED } from "@/lib/rules";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Blind audio upload.
 * - Production (Vercel Blob): issues a short-lived client-upload token so the browser uploads
 *   straight to private Blob storage (no 4.5 MB function body limit). Path is always
 *   blind-incoming/track.<ext> + random suffix — never the original filename.
 * - Local dev without a Blob token: accepts the file body directly and returns a ticket.
 * Either way /api/entries then strips all tags and re-stores it under a random name.
 */
export async function POST(req: Request) {
  if (PUBLIC_CLOSED) return json({ error: "Scroll Call is paused." }, 503);
  const user = await requireUser();
  if (isResponse(user)) return user;

  const type = req.headers.get("content-type") || "";
  if (type.includes("application/json")) {
    if (!blobEnabled()) return json({ mode: "local" });
    const body = (await req.json()) as HandleUploadBody;
    if (body.type !== "blob.generate-client-token") return json({ error: "Unsupported." }, 400);
    try {
      const result = await handleUpload({
        body,
        request: req,
        onBeforeGenerateToken: async (pathname) => {
          if (!/^blind-incoming\/track\.(mp3|m4a|wav)$/.test(pathname) || !pathname.startsWith(BLIND_INCOMING_PREFIX)) {
            throw new Error("Invalid upload path.");
          }
          return {
            allowedContentTypes: BLIND_AUDIO_MIME,
            maximumSizeInBytes: BLIND_AUDIO_MAX_BYTES,
            addRandomSuffix: true,
            validUntil: Date.now() + 15 * 60 * 1000,
          };
        },
      });
      return json(result);
    } catch (err) {
      return json({ error: err instanceof Error ? err.message : "Upload failed." }, 400);
    }
  }

  // Local dev fallback (no Blob configured). Raw bytes only — no filename is read or kept.
  if (blobEnabled()) return json({ error: "Use the in-page uploader." }, 400);
  const len = Number(req.headers.get("content-length") || 0);
  if (len > BLIND_AUDIO_MAX_BYTES) return json({ error: "Audio must be 25 MB or smaller." }, 413);
  const bytes = Buffer.from(await req.arrayBuffer());
  if (!bytes.length) return json({ error: "That file is empty." }, 400);
  try {
    const ticket = await saveLocalIncoming(bytes);
    return json({ ticket });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Upload failed." }, 400);
  }
}
