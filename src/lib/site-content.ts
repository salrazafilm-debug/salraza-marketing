import { getSupabaseAdmin } from "@/lib/supabase";

/**
 * The editable text on the Media Vault login page (/clients). Everything
 * else on that page (torn paper, tape, the vault door, the lock doodle,
 * layout) is fixed design, not stored here.
 */
export const VAULT_INTRO_TEXT_KEY = "vault-intro-text";
export const DEFAULT_VAULT_INTRO_TEXT =
  "Every family gets a private safe deposit for finished galleries, edits, photos and videos.";

const TEXT_KEYS: readonly string[] = [VAULT_INTRO_TEXT_KEY];

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
