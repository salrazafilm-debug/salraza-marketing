import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { addMediaVariant } from "@/lib/clients";

/** Called after the browser has already uploaded the variant image straight to Cloudinary, to save its metadata. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const image = String(body.image ?? "").trim();
  const cloudinaryPublicId = String(body.cloudinaryPublicId ?? "").trim();

  if (!image || !cloudinaryPublicId) {
    return NextResponse.json({ error: "Missing upload data." }, { status: 400 });
  }

  try {
    await addMediaVariant(id, image, cloudinaryPublicId);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save the variant." },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
