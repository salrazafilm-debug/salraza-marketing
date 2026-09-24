import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { addMediaItem } from "@/lib/clients";

/** Called after the browser has already uploaded the file straight to Cloudinary, to save its metadata. */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { slug } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const type = body.type === "video" ? "video" : body.type === "image" ? "image" : null;
  const label = String(body.label ?? "").trim();
  const caption = typeof body.caption === "string" ? body.caption.trim() : undefined;
  const src = String(body.src ?? "").trim();
  const cloudinaryPublicId = String(body.cloudinaryPublicId ?? "").trim();

  if (!type || !label || !src || !cloudinaryPublicId) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  try {
    await addMediaItem(slug, { type, label, caption, src, cloudinaryPublicId });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save media item." },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
