import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { deleteFolder } from "@/lib/clients";
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
