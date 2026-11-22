import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { findClientBySlug } from "@/lib/clients";
import { addGuestPassword, deleteGuestPassword } from "@/lib/guest-access";

/** Adds a guest password: opens the vault but only shows locked folder covers. */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const { slug } = await params;
  const body = (await request.json().catch(() => ({}))) as { password?: unknown };
  const password = typeof body.password === "string" ? body.password : "";
  if (password.length < 6) return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  if (!(await findClientBySlug(slug))) return NextResponse.json({ error: "Family not found." }, { status: 404 });
  try {
    await addGuestPassword(slug, password);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not add guest password." }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const { slug } = await params;
  const body = (await request.json().catch(() => ({}))) as { id?: unknown };
  if (typeof body.id !== "string") return NextResponse.json({ error: "Missing id." }, { status: 400 });
  try {
    await deleteGuestPassword(slug, body.id);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not remove guest password." }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
