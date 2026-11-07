import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { deleteFolder, updateFolder } from "@/lib/clients";
import { deleteCloudinaryAsset } from "@/lib/cloudinary";

/** Deletes a folder and everything in it, including the Cloudinary files. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;

  let deletedItems: { cloudinaryPublicId: string; type: "image" | "video" }[];
  try {
    deletedItems = await deleteFolder(id);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not delete folder." },
      { status: 400 }
    );
  }

  await Promise.all(
    deletedItems.map((item) =>
      deleteCloudinaryAsset(item.cloudinaryPublicId, item.type).catch(() => {
        // Same as single-item delete: don't let a Cloudinary hiccup block
        // the folder from actually going away.
      })
    )
  );

  return NextResponse.json({ ok: true });
}

/** Renames a folder, changes its event date, or sets its cover thumbnail. */
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

  const updates: {
    name?: string;
    eventDate?: string | null;
    coverMediaId?: string | null;
    coverUrl?: string | null;
  } = {};
  if (typeof body.name === "string" && body.name.trim()) updates.name = body.name.trim();
  if ("eventDate" in body) {
    updates.eventDate =
      typeof body.eventDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.eventDate)
        ? body.eventDate
        : null;
  }
  if ("coverMediaId" in body) {
    updates.coverMediaId =
      typeof body.coverMediaId === "string" && body.coverMediaId ? body.coverMediaId : null;
  }

  if ("coverUrl" in body) {
    updates.coverUrl =
      typeof body.coverUrl === "string" && /^https:\/\//i.test(body.coverUrl) ? body.coverUrl : null;
  }

  try {
    await updateFolder(id, updates);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update folder." },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
