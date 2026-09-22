import { nanoid } from "nanoid";
import { isResponse, json, requireUser } from "@/lib/api";
import { embedAllowed, linkHelp, parseEmbed } from "@/lib/embed";
import { readArtistLinks, uniqueSlug } from "@/lib/format";
import {
  PRICE,
  PUBLIC_CLOSED,
  isArena,
  isAudioLounge,
  loungeRequiresPayment,
  type ScreenKind,
} from "@/lib/rules";
import { remainingToday } from "@/lib/queries";
import { consumeFreePass } from "@/lib/promo";
import { markEntryPaid, markFoundingEntry } from "@/lib/money";
import { createEntryCheckout, stripeEnabled } from "@/lib/stripe";
import { updateStore } from "@/lib/store";
import { isoWeekId } from "@/lib/week";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (PUBLIC_CLOSED) {
    return json({ error: "Scroll Call is paused. Check back when the house reopens." }, 503);
  }
  const user = await requireUser();
  if (isResponse(user)) return user;
  /* Cash App / PayPal optional at entry */

  const data = await req.formData();
  const arenaRaw = String(data.get("arena") || "tracks");
  const arena = isArena(arenaRaw) ? arenaRaw : "tracks";
  const title = String(data.get("title") || "").trim();
  const genre = String(data.get("genre") || "").trim();
  const logline = String(data.get("logline") || "").trim();
  const screenKind: ScreenKind | null =
    arena === "video" ? "music-video" : arena === "film" ? "short" : null;
  const durationSeconds = Math.round(Number(data.get("durationSeconds") || 0));
  const cover = data.get("cover");
  const media = data.get("media");
  const mediaFile = media instanceof File && media.size > 0 ? media : null;
  const coverFile = cover instanceof File && cover.size > 0 ? cover : null;
  const sourceUrl = String(data.get("sourceUrl") || "").trim();
  const usePass = String(data.get("useFreePass") || "") === "1";
  const audio = isAudioLounge(arena);
  const embed = parseEmbed(sourceUrl);

  if (!title) return json({ error: "Add a title." }, 400);
  if (!genre) return json({ error: "Add a genre." }, 400);
  if (!logline) return json({ error: "Add a one-line pitch." }, 400);
  if (mediaFile || coverFile) {
    return json({ error: "Paste a link instead of uploading a file." }, 400);
  }
  if (!embed) {
    return json({ error: sourceUrl ? `That link is not supported. ${linkHelp(audio)}` : linkHelp(audio) }, 400);
  }
  if (!embedAllowed(embed, audio)) {
    return json({ error: `That site is not allowed in this lounge. ${linkHelp(audio)}` }, 400);
  }

  const coverPath = "/seed/hero.jpg";
  const mediaPath = embed.original;
  const bytes = 0;

  const created = await updateStore((store) => {
    if (remainingToday(store, user.id, arena) <= 0) {
      throw new Error(
        arena === "blind"
          ? "Blind is one entry per 24 hours. Come back tomorrow."
          : `You already used ${PRICE[arena].maxPerDay} entries in this lounge in the last 24 hours.`,
      );
    }
    const slug = uniqueSlug(title, new Set(store.entries.map((e) => e.slug)));
    const entry = {
      id: `e_${nanoid(10)}`,
      slug,
      userId: user.id,
      arena,
      screenKind,
      title,
      genre,
      logline,
      coverPath,
      mediaPath,
      durationSeconds: durationSeconds || (isAudioLounge(arena) ? 45 : 60),
      hookStartSeconds: 0,
      bytes,
      status: "draft" as const,
      weekId: isoWeekId(),
      createdAt: new Date().toISOString(),
      paidAt: null,
      stripeSessionId: null,
      potCents: 0,
      houseCents: 0,
      feeCents: 0,
      fanCents: 0,
      scoutKeeps: 0,
      scoutPasses: 0,
      heatVotes: 0,
      playCount: 0,
      links: readArtistLinks(data),
    };
    store.entries.push(entry);
    const owner = store.users.find((u) => u.id === user.id);
    const hadFounding = Boolean(owner?.earnedFoundingPass);
    if (usePass && loungeRequiresPayment(arena, store.chargesLive) && owner && consumeFreePass(owner)) {
      markEntryPaid(store, entry, "pass");
      return {
        entry,
        founding: false as const,
        beta: false as const,
        pass: true as const,
        awardedPass: Boolean(owner.earnedFoundingPass) && !hadFounding,
      };
    }
    if (!store.chargesLive) {
      markFoundingEntry(store, entry);
      return {
        entry,
        founding: true as const,
        beta: false as const,
        pass: false as const,
        awardedPass: Boolean(owner?.earnedFoundingPass) && !hadFounding,
      };
    }
    if (!loungeRequiresPayment(arena, store.chargesLive)) {
      markFoundingEntry(store, entry);
      return {
        entry,
        founding: false as const,
        beta: true as const,
        pass: false as const,
        awardedPass: Boolean(owner?.earnedFoundingPass) && !hadFounding,
      };
    }
    return { entry, founding: false as const, beta: false as const, pass: false as const, awardedPass: false };
  }).catch((err: Error) => err);

  if (created instanceof Error) return json({ error: created.message }, 400);

  if (created.founding || created.pass || created.beta) {
    return json({
      ok: true,
      founding: created.founding,
      beta: created.beta,
      pass: created.pass,
      awardedPass: created.awardedPass,
      slug: created.entry.slug,
    });
  }

  if (!stripeEnabled()) {
    const demo = await updateStore((store) => {
      const row = store.entries.find((e) => e.id === created.entry.id);
      const owner = store.users.find((u) => u.id === user.id);
      const had = Boolean(owner?.earnedFoundingPass);
      if (row) markEntryPaid(store, row, "demo");
      return { awardedPass: Boolean(owner?.earnedFoundingPass) && !had };
    });
    return json({ ok: true, demo: true, slug: created.entry.slug, awardedPass: demo.awardedPass });
  }

  let session;
  try {
    session = await createEntryCheckout({
      entryId: created.entry.id,
      userId: user.id,
      email: user.email,
      arena,
      title,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe checkout failed.";
    return json({ error: message }, 502);
  }

  if (!session.url) return json({ error: "Stripe did not return a checkout URL." }, 502);

  await updateStore((store) => {
    const row = store.entries.find((e) => e.id === created.entry.id);
    if (row) row.stripeSessionId = session.id;
  });

  return json({ ok: true, checkoutUrl: session.url, slug: created.entry.slug });
}
