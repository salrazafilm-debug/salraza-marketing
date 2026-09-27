import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { isKnownImageKey, isKnownTextKey, setSiteImage, setSiteText } from "@/lib/site-content";

/** Saves one uploaded photo (called right after the direct-to-Cloudinary upload finishes). */
export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const key = String(body.key ?? "");
  const src = String(body.src ?? "").trim();
  const cloudinaryPublicId = String(body.cloudinaryPublicId ?? "").trim();

  if (!isKnownImageKey(key)) {
    return NextResponse.json({ error: "Unknown image slot." }, { status: 400 });
  }
  if (!src || !cloudinaryPublicId) {
    return NextResponse.json({ error: "Missing upload data." }, { status: 400 });
  }

  await setSiteImage(key, src, cloudinaryPublicId);

  return NextResponse.json({ ok: true });
}

/** Saves one or more text fields (captions, supporting copy) from the admin dashboard form. */
export async function PATCH(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const fields = body.fields;
  if (!fields || typeof fields !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const entries = Object.entries(fields as Record<string, unknown>).filter(([key]) =>
    isKnownTextKey(key)
  );
  if (entries.length === 0) {
    return NextResponse.json({ error: "No valid fields." }, { status: 400 });
  }

  for (const [key, value] of entries) {
    await setSiteText(key, String(value ?? ""));
  }

  return NextResponse.json({ ok: true });
}
