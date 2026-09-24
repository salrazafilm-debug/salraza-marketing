import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { findMediaItem, updateMediaItem, deleteMediaItem } from "@/lib/clients";
import { deleteCloudinaryAsset } from "@/lib/cloudinary";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const updates: { label?: string; caption?: string } = {};
  if (typeof body.label === "string" && body.label.trim()) updates.label = body.label.trim();
  if (typeof body.caption === "string") updates.caption = body.caption.trim();

  try {
    await updateMediaItem(id, updates);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update media item." },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;

  const item = await findMediaItem(id);
  if (!item) {
    return NextResponse.json({ error: "Media item not found." }, { status: 404 });
  }

  try {
    await deleteCloudinaryAsset(item.cloudinaryPublicId, item.type);
  } catch {
    // If Cloudinary cleanup fails (e.g. already deleted there), still remove
    // our own record rather than leaving a broken item stuck in the gallery.
  }

  await deleteMediaItem(id);

  return NextResponse.json({ ok: true });
}
