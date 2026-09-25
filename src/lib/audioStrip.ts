/**
 * Blind audio sanitizer. Pure functions (no fs / network) so they can be unit tested.
 *
 * Goal: nothing inside the stored file should identify the artist — no ID3 / APE / Lyrics3
 * tags (title, artist, album art), no WAV LIST/INFO/bext/iXML/id3 chunks, no M4A udta/meta
 * (iTunes ilst: ©nam, ©ART, covr…). Audio frames are left untouched.
 */

export type BlindAudioFormat = "mp3" | "m4a" | "wav";

export type StrippedAudio = {
  format: BlindAudioFormat;
  ext: string;
  contentType: string;
  data: Buffer;
  /** Bytes removed or blanked while stripping metadata. */
  removedBytes: number;
};

export const BLIND_CONTENT_TYPE: Record<BlindAudioFormat, string> = {
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  wav: "audio/wav",
};

function ascii(buf: Buffer, start: number, len: number) {
  if (start < 0 || start + len > buf.length) return "";
  return buf.toString("latin1", start, start + len);
}

function isMpegFrameSync(buf: Buffer, i: number) {
  if (i + 1 >= buf.length) return false;
  if (buf[i] !== 0xff || (buf[i + 1] & 0xe0) !== 0xe0) return false;
  const version = (buf[i + 1] >> 3) & 0x03; // 01 reserved
  const layer = (buf[i + 1] >> 1) & 0x03; // 00 reserved
  return version !== 0x01 && layer !== 0x00;
}

function syncsafe(buf: Buffer, off: number) {
  return ((buf[off] & 0x7f) << 21) | ((buf[off + 1] & 0x7f) << 14) | ((buf[off + 2] & 0x7f) << 7) | (buf[off + 3] & 0x7f);
}

/** Sniff container from magic bytes (never trust the filename or MIME type alone). */
export function sniffAudioFormat(buf: Buffer): BlindAudioFormat | null {
  if (buf.length < 12) return null;
  if (ascii(buf, 0, 4) === "RIFF" && ascii(buf, 8, 4) === "WAVE") return "wav";
  if (ascii(buf, 4, 4) === "ftyp") return "m4a";
  if (ascii(buf, 0, 3) === "ID3") return "mp3";
  if (isMpegFrameSync(buf, 0)) return "mp3";
  return null;
}

// ---------------------------------------------------------------- MP3

export function stripMp3(input: Buffer): Buffer {
  let start = 0;
  // One or more ID3v2 tags at the front (some encoders stack them).
  while (ascii(input, start, 3) === "ID3" && start + 10 <= input.length) {
    const flags = input[start + 5];
    const size = syncsafe(input, start + 6);
    const footer = flags & 0x10 ? 10 : 0;
    start += 10 + size + footer;
  }
  // Skip zero padding some taggers leave after the tag.
  while (start < input.length && input[start] === 0x00) start += 1;
  if (!isMpegFrameSync(input, start)) {
    // Scan a little for the first real frame (bad padding / junk).
    let found = -1;
    const limit = Math.min(input.length - 1, start + 64 * 1024);
    for (let i = start; i < limit; i++) {
      if (isMpegFrameSync(input, i)) {
        found = i;
        break;
      }
    }
    if (found < 0) throw new Error("That MP3 has no audio frames we can read.");
    start = found;
  }

  let end = input.length;
  let changed = true;
  while (changed && end > start) {
    changed = false;
    // ID3v1 (128 bytes) and Enhanced TAG+ (227 bytes before it).
    if (end - 128 >= start && ascii(input, end - 128, 3) === "TAG") {
      end -= 128;
      if (end - 227 >= start && ascii(input, end - 227, 4) === "TAG+") end -= 227;
      changed = true;
      continue;
    }
    // ID3v2.4 appended tag with footer "3DI".
    if (end - 10 >= start && ascii(input, end - 10, 3) === "3DI") {
      const size = syncsafe(input, end - 4);
      const total = size + 20;
      if (end - total >= start) {
        end -= total;
        changed = true;
        continue;
      }
    }
    // APEv2 / APEv1 footer.
    if (end - 32 >= start && ascii(input, end - 32, 8) === "APETAGEX") {
      const tagSize = input.readUInt32LE(end - 32 + 12); // includes footer, excludes header
      const flags = input.readUInt32LE(end - 32 + 20);
      const hasHeader = (flags & 0x80000000) !== 0;
      const total = tagSize + (hasHeader ? 32 : 0);
      if (total > 0 && end - total >= start) {
        end -= total;
        changed = true;
        continue;
      }
    }
    // Lyrics3 v2: "<size 6 digits>LYRICS200" before end.
    if (end - 15 >= start && ascii(input, end - 9, 9) === "LYRICS200") {
      const size = Number(ascii(input, end - 15, 6));
      const total = size + 15;
      if (Number.isFinite(size) && end - total >= start && ascii(input, end - total, 11) === "LYRICSBEGIN") {
        end -= total;
        changed = true;
        continue;
      }
    }
  }
  return Buffer.from(input.subarray(start, end));
}

// ---------------------------------------------------------------- WAV

const WAV_KEEP = new Set(["fmt ", "data", "fact"]);

export function stripWav(input: Buffer): Buffer {
  if (ascii(input, 0, 4) !== "RIFF" || ascii(input, 8, 4) !== "WAVE") {
    throw new Error("That WAV file is not readable.");
  }
  const parts: Buffer[] = [];
  let off = 12;
  let sawFmt = false;
  let sawData = false;
  while (off + 8 <= input.length) {
    const id = ascii(input, off, 4);
    let size = input.readUInt32LE(off + 4);
    const bodyStart = off + 8;
    if (bodyStart + size > input.length) {
      // Truncated / streaming-style data chunk: keep what is there.
      size = input.length - bodyStart;
    }
    const padded = size + (size % 2);
    if (WAV_KEEP.has(id)) {
      if (id === "fmt ") sawFmt = true;
      if (id === "data") sawData = true;
      const header = Buffer.alloc(8);
      header.write(id, 0, "latin1");
      header.writeUInt32LE(size, 4);
      parts.push(header, input.subarray(bodyStart, bodyStart + size));
      if (size % 2) parts.push(Buffer.alloc(1));
    }
    off = bodyStart + padded;
  }
  if (!sawFmt || !sawData) throw new Error("That WAV file is missing audio data.");
  const body = Buffer.concat(parts);
  const head = Buffer.alloc(12);
  head.write("RIFF", 0, "latin1");
  head.writeUInt32LE(body.length + 4, 4);
  head.write("WAVE", 8, "latin1");
  return Buffer.concat([head, body]);
}

// ---------------------------------------------------------------- M4A / MP4

const CONTAINERS = new Set(["moov", "trak", "mdia", "minf", "stbl", "edts", "dinf", "mvex", "moof", "traf"]);
const BLANK = new Set(["udta", "meta", "ilst", "uuid", "Xtra", "XMP_", "tags", "ID32"]);

function blankAtom(buf: Buffer, start: number, size: number) {
  // Same size, type "free", zeroed payload. Offsets (stco/co64) stay valid.
  buf.write("free", start + 4, "latin1");
  buf.fill(0, start + 8, start + size);
}

function walkAtoms(buf: Buffer, from: number, to: number, depth: number): number {
  let blanked = 0;
  let off = from;
  while (off + 8 <= to) {
    let size = buf.readUInt32BE(off);
    const type = ascii(buf, off + 4, 4);
    let header = 8;
    if (size === 1) {
      if (off + 16 > to) break;
      const big = buf.readBigUInt64BE(off + 8);
      if (big > BigInt(Number.MAX_SAFE_INTEGER)) break;
      size = Number(big);
      header = 16;
    } else if (size === 0) {
      size = to - off;
    }
    if (size < header || off + size > to) break;
    if (BLANK.has(type) && depth > 0) {
      blankAtom(buf, off, size);
      blanked += size;
    } else if (BLANK.has(type) && depth === 0 && type !== "uuid") {
      blankAtom(buf, off, size);
      blanked += size;
    } else if (CONTAINERS.has(type)) {
      blanked += walkAtoms(buf, off + header, off + size, depth + 1);
    }
    off += size;
  }
  return blanked;
}

export function stripM4a(input: Buffer): { data: Buffer; blanked: number } {
  if (ascii(input, 4, 4) !== "ftyp") throw new Error("That M4A file is not readable.");
  const data = Buffer.from(input); // copy; we mutate in place
  const blanked = walkAtoms(data, 0, data.length, 0);
  let hasMoov = false;
  let off = 0;
  while (off + 8 <= data.length) {
    let size = data.readUInt32BE(off);
    const type = ascii(data, off + 4, 4);
    if (type === "moov") hasMoov = true;
    if (size === 1) size = Number(data.readBigUInt64BE(off + 8));
    if (size === 0) break;
    if (size < 8) break;
    off += size;
  }
  if (!hasMoov) throw new Error("That M4A file is missing its audio index.");
  return { data, blanked };
}

// ---------------------------------------------------------------- entry point

export function stripAudioMetadata(input: Buffer): StrippedAudio {
  const format = sniffAudioFormat(input);
  if (!format) throw new Error("Blind takes MP3, M4A, or WAV audio files only.");
  if (format === "mp3") {
    const data = stripMp3(input);
    return { format, ext: ".mp3", contentType: BLIND_CONTENT_TYPE.mp3, data, removedBytes: input.length - data.length };
  }
  if (format === "wav") {
    const data = stripWav(input);
    return { format, ext: ".wav", contentType: BLIND_CONTENT_TYPE.wav, data, removedBytes: input.length - data.length };
  }
  const { data, blanked } = stripM4a(input);
  return { format, ext: ".m4a", contentType: BLIND_CONTENT_TYPE.m4a, data, removedBytes: blanked };
}
