import { promises as fs } from "fs";
import path from "path";
import { contentTypeFor, mediaPath, rangeResponse } from "@/lib/media";

export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id || id.includes("..") || id.includes("/") || id.includes("\\")) {
    return new Response("Not found", { status: 404 });
  }
  const file = mediaPath(id);
  try {
    await fs.access(file);
  } catch {
    return new Response("Not found", { status: 404 });
  }
  return rangeResponse(file, req.headers.get("range"), contentTypeFor(id));
}

export function HEAD() {
  return new Response(null, { status: 200 });
}
