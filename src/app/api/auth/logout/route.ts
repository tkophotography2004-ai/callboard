import { clearSession } from "@/lib/auth";
import { json } from "@/lib/api";

export async function POST() {
  await clearSession();
  return new Response(null, { status: 302, headers: { Location: "/" } });
}

export async function GET() {
  await clearSession();
  return json({ ok: true });
}
