import { getSupabaseAdmin } from "@/lib/supabase";

/** The original intro that plays when a client enters their vault. */
export const ORIGINAL_INTRO_VIDEO = "/clients/dmv-marksmen/login-intro.mp4";

const KEY = "intro-video";

export type IntroVideoSetting = {
  /** "original" = the built-in intro; "custom" = the uploaded video below. */
  mode: "original" | "custom";
  /** The last uploaded video, kept so you can swap back and forth without re-uploading. */
  customUrl: string | null;
  customName: string | null;
};

const DEFAULT: IntroVideoSetting = { mode: "original", customUrl: null, customName: null };

/** Only our own Cloudinary uploads are accepted as custom videos. */
export function isAllowedVideoUrl(url: unknown): url is string {
  if (typeof url !== "string") return false;
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
}

export async function getIntroVideoSetting(): Promise<IntroVideoSetting> {
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase.from("site_content").select("value").eq("key", KEY).maybeSingle<{ value: string | null }>();
    if (!data?.value) return DEFAULT;
    const v = JSON.parse(data.value) as Partial<IntroVideoSetting>;
    return {
      mode: v.mode === "custom" && isAllowedVideoUrl(v.customUrl) ? "custom" : "original",
      customUrl: isAllowedVideoUrl(v.customUrl) ? v.customUrl : null,
      customName: typeof v.customName === "string" ? v.customName.slice(0, 200) : null,
    };
  } catch {
    return DEFAULT;
  }
}

export async function setIntroVideoSetting(setting: IntroVideoSetting): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("site_content").upsert({
    key: KEY,
    kind: "text",
    value: JSON.stringify(setting),
    cloudinary_public_id: null,
  });
  if (error) throw new Error(error.message);
}

/** The video the vault intro should play right now. */
export async function resolveIntroVideo(): Promise<string> {
  const s = await getIntroVideoSetting();
  return s.mode === "custom" && s.customUrl ? s.customUrl : ORIGINAL_INTRO_VIDEO;
}
