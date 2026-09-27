import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { setSiteImage, VAULT_PHOTO_KEYS } from "@/lib/site-images";

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

  if (!(VAULT_PHOTO_KEYS as readonly string[]).includes(key)) {
    return NextResponse.json({ error: "Unknown image slot." }, { status: 400 });
  }
  if (!src || !cloudinaryPublicId) {
    return NextResponse.json({ error: "Missing upload data." }, { status: 400 });
  }

  await setSiteImage(key, src, cloudinaryPublicId);

  return NextResponse.json({ ok: true });
}
