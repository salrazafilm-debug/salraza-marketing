import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { saveHomepageLayout } from "@/lib/site-layout";
import { DEFAULT_LAYOUT, parseLayout } from "@/components/site/layout-types";

/** Saves the homepage layout from the admin site editor. */
export async function PUT(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const layout = parseLayout((body as { layout?: unknown })?.layout);
  if (!layout) return NextResponse.json({ error: "That layout isn't valid." }, { status: 400 });

  await saveHomepageLayout(layout);
  return NextResponse.json({ ok: true });
}

/** Resets the homepage to the original design and words. */
export async function DELETE() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  await saveHomepageLayout(DEFAULT_LAYOUT);
  return NextResponse.json({ ok: true, layout: DEFAULT_LAYOUT });
}
