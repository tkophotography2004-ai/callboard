/** Client-safe Blind lounge constants + checks (no fs / server imports). */

export const BLIND_AUDIO_MAX_BYTES = 25 * 1024 * 1024;
export const BLIND_AUDIO_MAX_LABEL = "25 MB";
export const BLIND_AUDIO_ACCEPT =
  "audio/mpeg,audio/mp3,audio/mp4,audio/x-m4a,audio/m4a,audio/aac,audio/wav,audio/x-wav,audio/wave,audio/vnd.wave,.mp3,.m4a,.wav";
/** MIME types the Blob client token will accept (browsers report these for mp3/m4a/wav). */
export const BLIND_AUDIO_MIME = [
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/x-m4a",
  "audio/m4a",
  "audio/aac",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/vnd.wave",
  "application/octet-stream",
];
/** Default Blind artwork. Uploaded cover art is ignored for Blind until the reveal. */
export const BLIND_COVER = "/blind-cover.svg";
/** Blob pathname prefix for raw (not yet stripped) client uploads. */
export const BLIND_INCOMING_PREFIX = "blind-incoming/";
/** Submit-form footnote (replaces the old link-only line, which still listed Blind link hosts). */
export const SUBMIT_SOURCES_LINE =
  "Blind: upload an MP3, M4A, or WAV (audio only, no links). Music: paste a YouTube, SoundCloud, Spotify, Audiomack, TikTok, or Instagram link. Film, music videos, and Creator: YouTube, TikTok, Instagram, or Vimeo.";
export const BLIND_NOTE = "Blind is audio-only so nobody can tell who you are until you win.";

export function blindAudioExt(file: { name: string; type: string }) {
  const name = file.name.toLowerCase();
  if (name.endsWith(".mp3") || file.type === "audio/mpeg" || file.type === "audio/mp3") return ".mp3";
  if (name.endsWith(".wav") || /wav/.test(file.type)) return ".wav";
  if (name.endsWith(".m4a") || /mp4|m4a|aac/.test(file.type)) return ".m4a";
  return "";
}

/** Client + server: extension/MIME/size. Returns an error message or null. */
export function validateBlindAudioFile(file: { name: string; type: string; size: number } | null | undefined) {
  if (!file || !file.size) return "Choose your track (MP3, M4A, or WAV).";
  if (!blindAudioExt(file)) return "Blind takes MP3, M4A, or WAV audio files only.";
  if (file.size > BLIND_AUDIO_MAX_BYTES) return `Audio must be ${BLIND_AUDIO_MAX_LABEL} or smaller.`;
  return null;
}

/** Public, non-revealing playback URL for a Blind entry. */
export function blindMediaRoute(entryId: string) {
  return `/api/media/blind/${entryId}`;
}

export function isBlindMediaRoute(path: string | null | undefined) {
  return /^\/api\/media\/blind\/[A-Za-z0-9_-]+$/.test(String(path || ""));
}
