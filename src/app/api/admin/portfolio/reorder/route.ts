import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { reorderPortfolioItems } from "@/lib/portfolio";

export async function PATCH(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const orderedIds = body.orderedIds;
  if (!Array.isArray(orderedIds) || orderedIds.some((id) => typeof id !== "string")) {
    return NextResponse.json({ error: "orderedIds must be an array of strings." }, { status: 400 });
  }

  try {
    await reorderPortfolioItems(orderedIds);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not reorder the portfolio." },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
