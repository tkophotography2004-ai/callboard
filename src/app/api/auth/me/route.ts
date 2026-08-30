import { getSessionUser } from "@/lib/auth";
import { json } from "@/lib/api";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return json({ user: null });
  return json({ user });
}
