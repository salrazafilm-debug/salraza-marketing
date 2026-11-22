import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { findClientBySlug } from "@/lib/clients";
import { parseVaultLook, saveVaultLook } from "@/lib/vault-look";

/** Saves one client's vault page look. */
export async function PUT(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const { slug } = await params;
  if (!(await findClientBySlug(slug))) return NextResponse.json({ error: "Family not found." }, { status: 404 });
  const body = await request.json().catch(() => null);
  await saveVaultLook(slug, parseVaultLook((body as { look?: unknown } | null)?.look));
  return NextResponse.json({ ok: true });
}
