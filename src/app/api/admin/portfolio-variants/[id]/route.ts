import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { deletePortfolioVariant } from "@/lib/portfolio";
import { deleteCloudinaryAsset } from "@/lib/cloudinary";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;

  const deleted = await deletePortfolioVariant(id);
  if (!deleted) {
    return NextResponse.json({ error: "Variant not found." }, { status: 404 });
  }

  try {
    await deleteCloudinaryAsset(deleted.cloudinaryPublicId, "image");
  } catch {
    // If Cloudinary cleanup fails (e.g. already deleted there), the row is
    // already gone from our own list — nothing more to do.
  }

  return NextResponse.json({ ok: true });
}
