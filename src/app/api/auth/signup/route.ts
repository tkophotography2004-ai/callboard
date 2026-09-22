import { nanoid } from "nanoid";
import { setSession } from "@/lib/auth";
import { json } from "@/lib/api";
import { EMPTY_LINKS } from "@/lib/types";
import { emailOk, normalizeCashtag, normalizePaypalEmail, usernameOk } from "@/lib/rules";
import { hashPassword } from "@/lib/password";
import { updateStore } from "@/lib/store";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
    displayName?: string;
    username?: string;
    cashtag?: string;
    paypalEmail?: string;
  };
  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";
  const displayName = (body.displayName || "").trim();
  const username = (body.username || "").trim().toLowerCase();
  const cashtag = normalizeCashtag(body.cashtag || "");
  const paypalEmail = normalizePaypalEmail(body.paypalEmail || "");

  if (!emailOk(email)) return json({ error: "Enter a valid email." }, 400);
  if (password.length < 8) return json({ error: "Password must be at least 8 characters." }, 400);
  if (!displayName) return json({ error: "Enter the name you want on the board." }, 400);
  if (!usernameOk(username)) {
    return json({ error: "Username: 3-20 characters, lowercase letters, numbers, underscore." }, 400);
  }
  if (cashtag === null) {
    return json({ error: "Cash App cashtag looks invalid. Use something like $YourName, or leave it blank." }, 400);
  }
  if (paypalEmail === null) {
    return json({ error: "PayPal email looks invalid, or leave it blank." }, 400);
  }

  const passwordHash = await hashPassword(password);
  const created = await updateStore((store) => {
    if (store.users.some((u) => u.email === email)) {
      throw new Error("That email already has an account.");
    }
    if (store.users.some((u) => u.username === username)) {
      throw new Error("That username is taken.");
    }
    const user = {
      id: `u_${nanoid(10)}`,
      email,
      passwordHash,
      username,
      displayName,
      role: "artist" as const,
      cashtag,
      paypalEmail,
      bio: "",
      createdAt: new Date().toISOString(),
      freePasses: 0,
      earnedFoundingPass: false,
      links: { ...EMPTY_LINKS },
    };
    store.users.push(user);
    return user;
  }).catch((err: Error) => err);

  if (created instanceof Error) return json({ error: created.message }, 400);
  await setSession(created.id);
  return json({ ok: true, userId: created.id });
}