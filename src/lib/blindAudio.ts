import { customAlphabet } from "nanoid";
import { createReadStream, promises as fs } from "fs";
import path from "path";
import { Readable } from "stream";
import { stripAudioMetadata } from "./audioStrip";
import { BLIND_AUDIO_MAX_BYTES, BLIND_INCOMING_PREFIX } from "./blind";
import type { BlindAudio } from "./types";

/** Lowercase, URL-safe, non-guessable ids. */
export const randomId = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 24);
const shortId = customAlphabet("abcdefghijkmnpqrstuvwxyz23456789", 10);

export function randomBlindSlug(taken: Set<string>) {
  let slug = `blind-${shortId()}`;
  while (taken.has(slug)) slug = `blind-${shortId()}`;
  return slug;
}

export function blobEnabled() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}

/** Local dev fallback storage (only when no Blob token is configured). */
function localDir(kind: "incoming" | "audio") {
  return path.join(process.cwd(), "data", kind === "incoming" ? "blind-incoming" : "blind-audio");
}

function safeName(name: string) {
  const base = path.basename(name);
  if (base !== name || !/^[a-z0-9]+(\.(mp3|m4a|wav|bin))?$/.test(base)) throw new Error("invalid name");
  return base;
}

/** Local dev: save a raw upload and return an opaque ticket. */
export async function saveLocalIncoming(bytes: Buffer) {
  if (bytes.length > BLIND_AUDIO_MAX_BYTES) throw new Error("Audio must be 25 MB or smaller.");
  const id = randomId();
  await fs.mkdir(localDir("incoming"), { recursive: true });
  await fs.writeFile(path.join(localDir("incoming"), `${id}.bin`), bytes);
  return `local:${id}`;
}

function isOurIncomingBlobUrl(raw: string) {
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" || !u.hostname.endsWith(".blob.vercel-storage.com")) return false;
    const pathname = decodeURIComponent(u.pathname.replace(/^\//, ""));
    if (!pathname.startsWith(BLIND_INCOMING_PREFIX)) return false;
    return true;
  } catch {
    return false;
  }
}

async function readIncoming(ticket: string): Promise<{ bytes: Buffer; cleanup: () => Promise<void> }> {
  if (ticket.startsWith("local:")) {
    if (blobEnabled()) throw new Error("Upload expired. Choose the file again.");
    const file = path.join(localDir("incoming"), `${safeName(ticket.slice(6))}.bin`);
    const bytes = await fs.readFile(file).catch(() => null);
    if (!bytes) throw new Error("Upload expired. Choose the file again.");
    return { bytes, cleanup: () => fs.unlink(file).catch(() => undefined) };
  }
  if (!blobEnabled() || !isOurIncomingBlobUrl(ticket)) throw new Error("Upload not recognized. Choose the file again.");
  const { get, del } = await import("@vercel/blob");
  const result = await get(ticket, { access: "private", useCache: false });
  if (!result || result.statusCode !== 200 || !result.stream) throw new Error("Upload expired. Choose the file again.");
  const bytes = Buffer.from(await new Response(result.stream).arrayBuffer());
  return { bytes, cleanup: () => del(ticket).catch(() => undefined) };
}

/**
 * Take a raw upload (Blob client upload URL or local ticket), strip every metadata tag,
 * and store it under a random name. The original filename never reaches the server.
 */
export async function finalizeBlindUpload(ticket: string): Promise<BlindAudio> {
  const { bytes, cleanup } = await readIncoming(ticket);
  try {
    if (!bytes.length) throw new Error("That file is empty.");
    if (bytes.length > BLIND_AUDIO_MAX_BYTES) throw new Error("Audio must be 25 MB or smaller.");
    const clean = stripAudioMetadata(bytes);
    const name = `${randomId()}${clean.ext}`;
    if (blobEnabled()) {
      const { put } = await import("@vercel/blob");
      const blob = await put(`blind/a/${name}`, clean.data, {
        access: "private",
        addRandomSuffix: true,
        contentType: clean.contentType,
        cacheControlMaxAge: 60 * 60 * 24 * 30,
      });
      return { store: "blob", key: blob.pathname, contentType: clean.contentType, bytes: clean.data.length };
    }
    await fs.mkdir(localDir("audio"), { recursive: true });
    await fs.writeFile(path.join(localDir("audio"), name), clean.data);
    return { store: "local", key: name, contentType: clean.contentType, bytes: clean.data.length };
  } finally {
    await cleanup();
  }
}

/** Best-effort cleanup when an entry could not be created. */
export async function deleteBlindAudio(audio: BlindAudio) {
  try {
    if (audio.store === "local") {
      await fs.unlink(path.join(localDir("audio"), safeName(audio.key)));
      return;
    }
    const { del } = await import("@vercel/blob");
    await del(audio.key);
  } catch {
    /* ignore */
  }
}

type ParsedRange = { raw: string } | { invalid: true } | { start: number; end: number } | null;

function parseRange(header: string | null, size: number | null): ParsedRange {
  if (!header) return null;
  const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!m) return null;
  if (size === null) return { raw: header.trim() };
  let start: number;
  let end: number;
  if (m[1] === "" && m[2] !== "") {
    const suffix = Number(m[2]);
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = m[1] ? Number(m[1]) : 0;
    end = m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
  }
  if (start >= size || start > end) return { invalid: true as const };
  return { start, end };
}

const BASE_HEADERS = {
  "Accept-Ranges": "bytes",
  "Cache-Control": "private, max-age=3600",
  "Content-Disposition": "inline",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex",
};

/** Stream Blind audio without exposing where it lives. Supports byte ranges for Safari/iOS. */
export async function blindAudioResponse(audio: BlindAudio, rangeHeader: string | null): Promise<Response> {
  if (audio.store === "local") {
    const file = path.join(localDir("audio"), safeName(audio.key));
    const stat = await fs.stat(file).catch(() => null);
    if (!stat) return new Response("Not found", { status: 404 });
    const range = parseRange(rangeHeader, stat.size);
    if (range && "invalid" in range) {
      return new Response("Range not satisfiable", { status: 416, headers: { "Content-Range": `bytes */${stat.size}` } });
    }
    if (range && "start" in range) {
      const stream = createReadStream(file, { start: range.start, end: range.end });
      return new Response(Readable.toWeb(stream) as ReadableStream, {
        status: 206,
        headers: {
          ...BASE_HEADERS,
          "Content-Type": audio.contentType,
          "Content-Length": String(range.end - range.start + 1),
          "Content-Range": `bytes ${range.start}-${range.end}/${stat.size}`,
        },
      });
    }
    return new Response(Readable.toWeb(createReadStream(file)) as ReadableStream, {
      status: 200,
      headers: { ...BASE_HEADERS, "Content-Type": audio.contentType, "Content-Length": String(stat.size) },
    });
  }

  const { get } = await import("@vercel/blob");
  const size = audio.bytes || null;
  const range = parseRange(rangeHeader, size);
  if (range && "invalid" in range) {
    return new Response("Range not satisfiable", { status: 416, headers: { "Content-Range": `bytes */${size}` } });
  }
  const rangeValue =
    range && "start" in range ? `bytes=${range.start}-${range.end}` : range && "raw" in range ? range.raw : null;
  const result = await get(audio.key, {
    access: "private",
    headers: rangeValue ? { range: rangeValue } : undefined,
  });
  if (!result || result.statusCode !== 200 || !result.stream) return new Response("Not found", { status: 404 });
  const upstreamRange = result.headers.get("content-range");
  const length = result.headers.get("content-length");
  const headers: Record<string, string> = { ...BASE_HEADERS, "Content-Type": audio.contentType };
  if (length) headers["Content-Length"] = length;
  if (upstreamRange) headers["Content-Range"] = upstreamRange;
  return new Response(result.stream, { status: upstreamRange ? 206 : 200, headers });
}
