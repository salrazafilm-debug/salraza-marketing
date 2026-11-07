import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { createFolder } from "@/lib/clients";

function parseDate(value: unknown): string | null {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { slug } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "Folder name is required." }, { status: 400 });
  }

  const eventDate = parseDate(body.eventDate);

  try {
    await createFolder(slug, name, eventDate);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create folder." },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
