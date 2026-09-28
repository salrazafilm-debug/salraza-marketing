import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { deleteClientPassword } from "@/lib/clients";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;

  try {
    await deleteClientPassword(id);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not remove password." },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
