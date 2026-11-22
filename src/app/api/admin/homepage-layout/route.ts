import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import {
  getHomepageDraft,
  getHomepageHistory,
  getHomepageLayout,
  publishHomepage,
  saveHomepageDraft,
} from "@/lib/site-layout";
import { DEFAULT_LAYOUT, parseLayout } from "@/components/site/layout-types";

/** The editor's draft, what's live, and the list of earlier published versions. */
export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const [draft, published, history] = await Promise.all([getHomepageDraft(), getHomepageLayout(), getHomepageHistory()]);
  return NextResponse.json({
    draft,
    published,
    history: history.map((h, index) => ({ index, at: h.at, sections: h.layout.sections.length })),
  });
}

/** Autosaves the draft (does not change the live site). */
export async function PUT(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const body = await request.json().catch(() => null);
  const layout = parseLayout((body as { layout?: unknown } | null)?.layout);
  if (!layout) return NextResponse.json({ error: "That layout isn't valid." }, { status: 400 });
  await saveHomepageDraft(layout);
  return NextResponse.json({ ok: true });
}

/**
 * Actions:
 *   { action: "publish", layout }   make it live (previous live version goes to history)
 *   { action: "restore", index }    load an earlier published version into the draft
 *   { action: "reset" }             put the original design into the draft
 */
export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const action = body?.action;

  if (action === "publish") {
    const layout = parseLayout(body?.layout);
    if (!layout) return NextResponse.json({ error: "That layout isn't valid." }, { status: 400 });
    await publishHomepage(layout);
    return NextResponse.json({ ok: true });
  }

  if (action === "restore") {
    const history = await getHomepageHistory();
    const entry = typeof body?.index === "number" ? history[body.index] : undefined;
    if (!entry) return NextResponse.json({ error: "That version wasn't found." }, { status: 404 });
    await saveHomepageDraft(entry.layout);
    return NextResponse.json({ ok: true, layout: entry.layout });
  }

  if (action === "reset") {
    await saveHomepageDraft(DEFAULT_LAYOUT);
    return NextResponse.json({ ok: true, layout: DEFAULT_LAYOUT });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
