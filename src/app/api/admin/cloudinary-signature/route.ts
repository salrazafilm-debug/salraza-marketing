import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { createUploadSignature } from "@/lib/cloudinary";

/**
 * Signs an upload so the browser can send the file bytes straight to
 * Cloudinary, not through our own server (a large video would otherwise hit
 * Vercel's serverless request-size limit).
 */
export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const folder = String(body.folder ?? "").trim();
  if (!folder || !/^clients\/[a-z0-9-]+$/.test(folder)) {
    return NextResponse.json({ error: "Invalid folder." }, { status: 400 });
  }

  const { timestamp, signature, apiKey, cloudName } = createUploadSignature({ folder });

  return NextResponse.json({ timestamp, signature, apiKey, cloudName, folder });
}
