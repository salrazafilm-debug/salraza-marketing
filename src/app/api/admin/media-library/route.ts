import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { listPortfolioItems } from "@/lib/portfolio";
import { PHOTOS } from "@/components/cinema/photos";
import { displayUrl } from "@/lib/image-url";

export type LibraryImage = { url: string; title: string; source: "site" | "portfolio" };

/** Every image the editor can place: the built-in photos plus the portfolio uploads. */
export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const images: LibraryImage[] = PHOTOS.map((p) => ({ url: p.thumb, title: p.title, source: "site" }));
  try {
    const items = await listPortfolioItems();
    for (const item of items) {
      for (const img of item.images) {
        if (typeof img === "string" && img.startsWith("https://")) {
          images.push({ url: displayUrl(img), title: item.title, source: "portfolio" });
        }
      }
    }
  } catch {
    // No database (local development) — the built-in photos are still offered.
  }
  return NextResponse.json({ images });
}
