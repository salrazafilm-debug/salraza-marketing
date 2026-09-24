import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { updateClient, deleteClient } from "@/lib/clients";

export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { slug } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const updates: { name?: string; welcomeNote?: string; password?: string } = {};
  if (typeof body.name === "string" && body.name.trim()) updates.name = body.name.trim();
  if (typeof body.welcomeNote === "string") updates.welcomeNote = body.welcomeNote.trim();
  if (typeof body.password === "string" && body.password) {
    if (body.password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }
    updates.password = body.password;
  }

  try {
    await updateClient(slug, updates);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update family." },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { slug } = await params;

  try {
    await deleteClient(slug);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not delete family." },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
