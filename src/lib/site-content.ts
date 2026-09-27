import { getSupabaseAdmin } from "@/lib/supabase";

/**
 * The editable pieces of the scrapbook Media Vault login page (/clients):
 * three Polaroid photos, a short handwritten caption under each, and the
 * supporting paragraph under the headline. Everything else on that page
 * (torn paper, tape, rotations, the vault door, the lock doodle, layout) is
 * fixed design, not stored here.
 */
export const VAULT_PHOTO_SLOTS = [
  { key: "vault-photo-main", captionKey: "vault-caption-main", label: "Main family photo" },
  { key: "vault-photo-camera", captionKey: "vault-caption-camera", label: "Camera photo" },
  { key: "vault-photo-bottom-left", captionKey: "vault-caption-bottom-left", label: "Bottom-left photo" },
] as const;

export type VaultPhotoKey = (typeof VAULT_PHOTO_SLOTS)[number]["key"];
export type VaultCaptionKey = (typeof VAULT_PHOTO_SLOTS)[number]["captionKey"];

export const VAULT_INTRO_TEXT_KEY = "vault-intro-text";
export const DEFAULT_VAULT_INTRO_TEXT =
  "Every family gets a private safe deposit for finished galleries, edits, photos and videos. Type your password below to access.";

const IMAGE_KEYS: readonly string[] = VAULT_PHOTO_SLOTS.map((slot) => slot.key);
const TEXT_KEYS: readonly string[] = [
  ...VAULT_PHOTO_SLOTS.map((slot) => slot.captionKey),
  VAULT_INTRO_TEXT_KEY,
];

export function isKnownImageKey(key: string): boolean {
  return IMAGE_KEYS.includes(key);
}

export function isKnownTextKey(key: string): boolean {
  return TEXT_KEYS.includes(key);
}

export type SiteContentRow = {
  key: string;
  kind: "image" | "text";
  value: string | null;
  cloudinaryPublicId: string | null;
};

type Row = {
  key: string;
  kind: "image" | "text";
  value: string | null;
  cloudinary_public_id: string | null;
};

/** Looks up every stored piece of editable content, keyed by its slot name. */
export async function listSiteContent(): Promise<Record<string, SiteContentRow>> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("site_content").select("*").returns<Row[]>();

  if (error) throw new Error(error.message);

  const result: Record<string, SiteContentRow> = {};
  for (const row of data ?? []) {
    result[row.key] = {
      key: row.key,
      kind: row.kind,
      value: row.value,
      cloudinaryPublicId: row.cloudinary_public_id,
    };
  }
  return result;
}

/** Creates or replaces the image stored under a given slot key. */
export async function setSiteImage(
  key: string,
  src: string,
  cloudinaryPublicId: string
): Promise<void> {
  if (!isKnownImageKey(key)) throw new Error("Unknown image slot.");

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("site_content").upsert({
    key,
    kind: "image",
    value: src,
    cloudinary_public_id: cloudinaryPublicId,
    updated_at: new Date().toISOString(),
  });

  if (error) throw new Error(error.message);
}

/** Creates or replaces the text stored under a given content key. */
export async function setSiteText(key: string, value: string): Promise<void> {
  if (!isKnownTextKey(key)) throw new Error("Unknown text field.");

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("site_content").upsert({
    key,
    kind: "text",
    value,
    cloudinary_public_id: null,
    updated_at: new Date().toISOString(),
  });

  if (error) throw new Error(error.message);
}
