import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { addClientPassword } from "@/lib/clients";

/** Adds an extra password that unlocks the same vault as the client's primary password. */
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

  const password = typeof body.password === "string" ? body.password : "";
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  try {
    await addClientPassword(slug, password);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not add password." },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
