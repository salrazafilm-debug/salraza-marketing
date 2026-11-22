import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { getIntroVideoSetting, isAllowedVideoUrl, setIntroVideoSetting } from "@/lib/intro-video";

/**
 * Swap the vault intro video from the admin.
 * Body: { mode: "original" | "custom", customUrl?, customName? }.
 * Switching back to "original" keeps the uploaded video saved for next time.
 */
export async function PUT(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const current = await getIntroVideoSetting();

  const customUrl = body.customUrl === undefined ? current.customUrl : body.customUrl;
  if (customUrl !== null && !isAllowedVideoUrl(customUrl)) {
    return NextResponse.json({ error: "That video link isn't valid." }, { status: 400 });
  }
  const customName =
    typeof body.customName === "string" ? body.customName.slice(0, 200) : body.customUrl === undefined ? current.customName : null;
  const mode = body.mode === "custom" ? "custom" : "original";
  if (mode === "custom" && !customUrl) {
    return NextResponse.json({ error: "Upload a video first." }, { status: 400 });
  }

  try {
    await setIntroVideoSetting({ mode, customUrl: (customUrl as string | null) ?? null, customName });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not save." }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
