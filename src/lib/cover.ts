export const COVER_MAX_BYTES = 5 * 1024 * 1024;
export const COVER_ACCEPT = "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp";

const ALLOWED_IMAGE = new Set(["image/jpeg", "image/png", "image/webp"]);

export function isCoverImageFile(file: { type: string; name: string }) {
  if (ALLOWED_IMAGE.has(file.type)) return true;
  const name = file.name.toLowerCase();
  return (
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".png") ||
    name.endsWith(".webp")
  );
}

/** Client + server: MIME/extension/size. Returns error message or null. */
export function validateCoverFile(file: { type: string; name: string; size: number }) {
  if (!file || !file.size) return null;
  if (!isCoverImageFile(file)) return "Cover art must be a JPEG, PNG, or WebP image.";
  if (file.type && !ALLOWED_IMAGE.has(file.type)) {
    const name = file.name.toLowerCase();
    const okExt =
      name.endsWith(".jpg") ||
      name.endsWith(".jpeg") ||
      name.endsWith(".png") ||
      name.endsWith(".webp");
    if (!okExt) return "Cover art must be a JPEG, PNG, or WebP image.";
  }
  if (file.size > COVER_MAX_BYTES) return "Cover art must be 5MB or smaller.";
  return null;
}

export function looksLikeImageBytes(bytes: Uint8Array) {
  if (bytes.length < 12) return false;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return true;
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return true;
  const head = String.fromCharCode(...Array.from(bytes.slice(0, 4)));
  const mid = String.fromCharCode(...Array.from(bytes.slice(8, 12)));
  if (head === "RIFF" && mid === "WEBP") return true;
  return false;
}
