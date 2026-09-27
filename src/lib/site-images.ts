import { getSupabaseAdmin } from "@/lib/supabase";

/** The three Polaroid photo slots on the scrapbook Media Vault login page. */
export const VAULT_PHOTO_KEYS = ["vault-photo-1", "vault-photo-2", "vault-photo-3"] as const;
export type VaultPhotoKey = (typeof VAULT_PHOTO_KEYS)[number];

export type SiteImage = { key: string; src: string; cloudinaryPublicId: string };

type SiteImageRow = {
  key: string;
  src: string;
  cloudinary_public_id: string;
};

/** Looks up every stored site image, keyed by its slot name. Missing slots are simply absent. */
export async function listSiteImages(): Promise<Record<string, SiteImage>> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("site_images")
    .select("key, src, cloudinary_public_id")
    .returns<SiteImageRow[]>();

  if (error) throw new Error(error.message);

  const result: Record<string, SiteImage> = {};
  for (const row of data ?? []) {
    result[row.key] = { key: row.key, src: row.src, cloudinaryPublicId: row.cloudinary_public_id };
  }
  return result;
}

/** Creates or replaces the image stored under a given slot key. */
export async function setSiteImage(
  key: string,
  src: string,
  cloudinaryPublicId: string
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("site_images")
    .upsert({ key, src, cloudinary_public_id: cloudinaryPublicId, updated_at: new Date().toISOString() });

  if (error) throw new Error(error.message);
}
