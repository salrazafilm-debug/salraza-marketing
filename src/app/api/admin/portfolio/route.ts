import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { addPortfolioItem, PORTFOLIO_CATEGORIES, type PortfolioCategory } from "@/lib/portfolio";

/** Called after the browser has already uploaded the file straight to Cloudinary, to save its metadata. */
export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const title = String(body.title ?? "").trim();
  const category = PORTFOLIO_CATEGORIES.includes(body.category as PortfolioCategory)
    ? (body.category as PortfolioCategory)
    : null;
  const image = String(body.image ?? "").trim();
  const cloudinaryPublicId = String(body.cloudinaryPublicId ?? "").trim();

  if (!title || !category || !image || !cloudinaryPublicId) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  try {
    await addPortfolioItem({ title, category, image, cloudinaryPublicId });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save portfolio item." },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
