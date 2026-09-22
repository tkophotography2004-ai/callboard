import { nanoid } from "nanoid";
import { isResponse, json, requireUser } from "@/lib/api";
import { uniqueSlug } from "@/lib/format";
import { extFromFile, isAudioFile, isImageFile, isVideoFile, saveUploadFile } from "@/lib/media";
import {
  MAX_AUDIO_BYTES,
  MAX_AUDIO_SECONDS,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  MAX_VIDEO_SECONDS,
  PRICE,
  isArena,
  type ScreenKind,
} from "@/lib/rules";
import { remainingToday } from "@/lib/queries";
import { markEntryPaid, markFoundingEntry } from "@/lib/money";
import { createEntryCheckout, stripeEnabled } from "@/lib/stripe";
import { updateStore } from "@/lib/store";
import { isoWeekId } from "@/lib/week";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await requireUser();
  if (isResponse(user)) return user;
  const data = await req.formData();
  const arenaRaw = String(data.get("arena") || "tracks");
  const arena = isArena(arenaRaw) ? arenaRaw : "tracks";
  const title = String(data.get("title") || "").trim();
  const genre = String(data.get("genre") || "").trim();
  const logline = String(data.get("logline") || "").trim();
  const screenKindRaw = String(data.get("screenKind") || "series");
  const screenKind: ScreenKind | null =
    arena === "screen"
      ? screenKindRaw === "music-video" || screenKindRaw === "short"
        ? screenKindRaw
        : "series"
      : null;
  const durationSeconds = Math.round(Number(data.get("durationSeconds") || 0));
  const cover = data.get("cover");
  const media = data.get("media");

  if (!title) return json({ error: "Add a title." }, 400);
  if (!genre) return json({ error: "Add a genre." }, 400);
  if (!logline) return json({ error: "Add a one-line pitch." }, 400);
  if (!(media instanceof File) || !media.size) return json({ error: "Add the audio or video file." }, 400);

  if (arena === "tracks" || arena === "blind") {
    if (!isAudioFile(media)) return json({ error: "This board takes MP3, WAV, or M4A." }, 400);
    if (media.size > MAX_AUDIO_BYTES) return json({ error: "Audio must be under 40MB." }, 400);
    if (durationSeconds > MAX_AUDIO_SECONDS) return json({ error: "Tracks must be under 10 minutes." }, 400);
  } else {
    if (!isVideoFile(media)) return json({ error: "Screen files must be MP4, WebM, or MOV." }, 400);
    if (media.size > MAX_VIDEO_BYTES) return json({ error: "Video must be under 180MB." }, 400);
    if (durationSeconds > MAX_VIDEO_SECONDS) return json({ error: "Teasers must be under 2 minutes." }, 400);
  }
  if (cover instanceof File && cover.size > 0) {
    if (!isImageFile(cover)) return json({ error: "Cover must be JPG, PNG, or WebP." }, 400);
    if (cover.size > MAX_IMAGE_BYTES) return json({ error: "Cover must be under 8MB." }, 400);
  }

  let coverPath = "/seed/hero.jpg";
  if (cover instanceof File && cover.size > 0) {
    coverPath = await saveUploadFile(`cover_${nanoid(12)}${extFromFile(cover, ".jpg")}`, cover);
  }
  const mediaPath = await saveUploadFile(
    `media_${nanoid(12)}${extFromFile(media, arena === "screen" ? ".mp4" : ".mp3")}`,
    media,
  );

  const created = await updateStore((store) => {
    if (remainingToday(store, user.id, arena) <= 0) {
      throw new Error(
        arena === "blind"
          ? "Blind is one entry per 24 hours. Come back tomorrow."
          : `You already used ${PRICE.tracks.maxPerDay} $5 submissions in the last 24 hours.`,
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
      durationSeconds: durationSeconds || (arena === "screen" ? 60 : 45),
      hookStartSeconds: 0,
      bytes: media.size,
      status: "draft" as const,
      weekId: isoWeekId(),
      createdAt: new Date().toISOString(),
      paidAt: null,
      stripeSessionId: null,
      potCents: 0,
      houseCents: 0,
      feeCents: 0,
      scoutKeeps: 0,
      scoutPasses: 0,
      heatVotes: 0,
      playCount: 0,
    };
    store.entries.push(entry);
    if (!store.chargesLive) {
      markFoundingEntry(store, entry);
      return { entry, founding: true as const };
    }
    return { entry, founding: false as const };
  }).catch((err: Error) => err);

  if (created instanceof Error) return json({ error: created.message }, 400);

  if (created.founding) {
    return json({ ok: true, founding: true, slug: created.entry.slug });
  }

  if (!stripeEnabled()) {
    await updateStore((store) => {
      const row = store.entries.find((e) => e.id === created.entry.id);
      if (row) markEntryPaid(store, row, "demo");
    });
    return json({ ok: true, demo: true, slug: created.entry.slug });
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
