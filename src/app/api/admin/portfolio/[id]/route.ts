import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { deletePortfolioItem } from "@/lib/portfolio";
import { deleteCloudinaryAsset } from "@/lib/cloudinary";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;

  const deleted = await deletePortfolioItem(id);
  if (!deleted) {
    return NextResponse.json({ error: "Portfolio item not found." }, { status: 404 });
  }

  // Items seeded from the site's original static images have no Cloudinary
  // asset (cloudinaryPublicId is null) — nothing to clean up there.
  if (deleted.cloudinaryPublicId) {
    try {
      await deleteCloudinaryAsset(deleted.cloudinaryPublicId, "image");
    } catch {
      // If Cloudinary cleanup fails (e.g. already deleted there), the row is
      // already gone from our own list — nothing more to do.
    }
  }

  return NextResponse.json({ ok: true });
}
