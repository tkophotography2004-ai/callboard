import { nanoid } from "nanoid";
import { looksLikeImageBytes, validateCoverFile } from "@/lib/cover";
import { promises as fs } from "fs";
import { createReadStream, createWriteStream, statSync } from "fs";
import path from "path";
import { Readable } from "stream";
import { pipeline } from "stream/promises";

const ALLOWED_VIDEO = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const ALLOWED_IMAGE = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_AUDIO = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/wave",
  "audio/x-wav",
  "audio/vnd.wave",
  "audio/ogg",
  "audio/webm",
  "audio/mp4",
  "audio/aac",
  "audio/x-m4a",
]);

export function mediaDir() {
  return path.join(process.cwd(), "data", "media");
}

export function mediaPath(filename: string) {
  const safe = path.basename(filename);
  if (safe !== filename || safe.includes("..")) {
    throw new Error("invalid media name");
  }
  return path.join(mediaDir(), safe);
}

export function extFor(type: string, fallback: string) {
  if (type === "video/webm") return ".webm";
  if (type === "video/quicktime") return ".mov";
  if (type === "image/png") return ".png";
  if (type === "image/webp") return ".webp";
  if (type === "image/jpeg") return ".jpg";
  if (type === "video/mp4") return ".mp4";
  if (type === "audio/mpeg" || type === "audio/mp3") return ".mp3";
  if (type === "audio/wav" || type === "audio/x-wav") return ".wav";
  if (type === "audio/ogg") return ".ogg";
  if (type === "audio/mp4" || type === "audio/x-m4a" || type === "audio/aac") return ".m4a";
  return fallback;
}

export function isVideoFile(file: { type: string; name: string }) {
  if (ALLOWED_VIDEO.has(file.type)) return true;
  const name = file.name.toLowerCase();
  return name.endsWith(".mp4") || name.endsWith(".webm") || name.endsWith(".mov");
}

export function isImageFile(file: { type: string; name: string }) {
  if (ALLOWED_IMAGE.has(file.type)) return true;
  const name = file.name.toLowerCase();
  return name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png") || name.endsWith(".webp");
}

export function isAudioFile(file: { type: string; name: string }) {
  if (ALLOWED_AUDIO.has(file.type)) return true;
  const name = file.name.toLowerCase();
  return (
    name.endsWith(".mp3") ||
    name.endsWith(".wav") ||
    name.endsWith(".ogg") ||
    name.endsWith(".m4a") ||
    name.endsWith(".aac")
  );
}

export function extFromFile(file: { type: string; name: string }, fallback: string) {
  const fromName = path.extname(file.name).toLowerCase();
  if (fromName) return fromName;
  return extFor(file.type, fallback);
}

export async function saveUpload(filename: string, bytes: Buffer) {
  await fs.mkdir(mediaDir(), { recursive: true });
  const dest = mediaPath(filename);
  await fs.writeFile(dest, bytes);
  return `/api/media/${filename}`;
}

export async function saveUploadFile(filename: string, file: File) {
  await fs.mkdir(mediaDir(), { recursive: true });
  const dest = mediaPath(filename);
  try {
    const input = Readable.fromWeb(file.stream() as import("stream/web").ReadableStream);
    await pipeline(input, createWriteStream(dest));
  } catch {
    await fs.writeFile(dest, Buffer.from(await file.arrayBuffer()));
  }
  return `/api/media/${filename}`;
}

export function contentTypeFor(filename: string) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".webm") return "video/webm";
  if (ext === ".mov") return "video/quicktime";
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".mp3") return "audio/mpeg";
  if (ext === ".wav") return "audio/wav";
  if (ext === ".ogg") return "audio/ogg";
  if (ext === ".m4a" || ext === ".aac") return "audio/mp4";
  return "video/mp4";
}

export function rangeResponse(file: string, rangeHeader: string | null, contentType: string) {
  const stat = statSync(file);
  const size = stat.size;
  if (!rangeHeader) {
    const stream = createReadStream(file);
    return new Response(Readable.toWeb(stream) as ReadableStream, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(size),
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=86400",
      },
    });
  }
  const match = /bytes=(\d*)-(\d*)/.exec(rangeHeader);
  if (!match) return new Response("Invalid range", { status: 416 });
  const start = match[1] ? Number(match[1]) : 0;
  const end = match[2] ? Number(match[2]) : size - 1;
  if (start >= size || end >= size || start > end) {
    return new Response("Range not satisfiable", {
      status: 416,
      headers: { "Content-Range": `bytes */${size}` },
    });
  }
  const chunk = end - start + 1;
  const stream = createReadStream(file, { start, end });
  return new Response(Readable.toWeb(stream) as ReadableStream, {
    status: 206,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(chunk),
      "Content-Range": `bytes ${start}-${end}/${size}`,
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=86400",
    },
  });
}

/** Tiny PCM WAV so seed tracks actually play. */
export function toneWav(freq: number, seconds = 12, sampleRate = 22050) {
  const samples = sampleRate * seconds;
  const dataSize = samples * 2;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const env = Math.min(1, t / 0.08, (seconds - t) / 0.4);
    const v =
      Math.sin(2 * Math.PI * freq * t) * 0.28 +
      Math.sin(2 * Math.PI * freq * 1.5 * t) * 0.1 +
      Math.sin(2 * Math.PI * (freq / 2) * t) * 0.08;
    buf.writeInt16LE(Math.round(v * env * 32767), 44 + i * 2);
  }
  return buf;
}

function blobEnabled() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}

/** Persist optional cover art. Prefer public Vercel Blob; fall back to local /api/media. */
export async function storeCoverArt(file: File): Promise<string> {
  const err = validateCoverFile(file);
  if (err) throw new Error(err);
  const buf = Buffer.from(await file.arrayBuffer());
  if (!looksLikeImageBytes(buf)) throw new Error("That file is not a valid image.");

  const mime = file.type && ALLOWED_IMAGE.has(file.type) ? file.type : contentTypeFor(extFromFile(file, ".jpg"));
  const ext = extFromFile({ type: mime, name: file.name }, ".jpg");
  const filename = `cover_${nanoid(12)}${ext}`;

  if (blobEnabled()) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`callboard/covers/${filename}`, buf, {
      access: "public",
      contentType: mime,
      addRandomSuffix: false,
    });
    return blob.url;
  }

  return saveUpload(filename, buf);
}
