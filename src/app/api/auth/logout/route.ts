import { clearSession } from "@/lib/auth";
import { json } from "@/lib/api";

export async function POST(req: Request) {
  await clearSession();
  const accept = req.headers.get("accept") || "";
  if (accept.includes("application/json")) {
    return json({ ok: true });
  }
  return new Response(null, { status: 302, headers: { Location: "/" } });
}

export async function GET(req: Request) {
  await clearSession();
  const accept = req.headers.get("accept") || "";
  if (accept.includes("text/html")) {
    return new Response(null, { status: 302, headers: { Location: "/" } });
  }
  return json({ ok: true });
}
