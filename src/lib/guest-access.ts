import { randomBytes } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase";
import { hashPassword, verifyPassword } from "@/lib/password";

/**
 * Guest passwords: they open a vault but only show the folder covers (locked).
 * Stored per client in the existing site_content table (one JSON row per
 * client), so no database change is needed. Only password hashes are kept.
 */
type Guest = { id: string; hash: string; createdAt: string };

const PREFIX = "guest-pw:";
const keyFor = (slug: string) => `${PREFIX}${slug}`;

function parse(value: string | null): Guest[] {
  if (!value) return [];
  try {
    const list = JSON.parse(value);
    return Array.isArray(list)
      ? list.filter((g): g is Guest => g && typeof g.id === "string" && typeof g.hash === "string" && typeof g.createdAt === "string")
      : [];
  } catch {
    return [];
  }
}

async function load(slug: string): Promise<Guest[]> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from("site_content").select("value").eq("key", keyFor(slug)).maybeSingle<{ value: string | null }>();
  return parse(data?.value ?? null);
}

async function save(slug: string, list: Guest[]): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("site_content").upsert({
    key: keyFor(slug),
    kind: "text",
    value: JSON.stringify(list),
    cloudinary_public_id: null,
  });
  if (error) throw new Error(error.message);
}

export async function listGuestPasswords(slug: string): Promise<{ id: string; createdAt: string }[]> {
  try {
    return (await load(slug)).map((g) => ({ id: g.id, createdAt: g.createdAt }));
  } catch {
    return [];
  }
}

export async function addGuestPassword(slug: string, password: string): Promise<void> {
  const list = await load(slug);
  list.push({ id: randomBytes(6).toString("hex"), hash: hashPassword(password), createdAt: new Date().toISOString() });
  await save(slug, list);
}

export async function deleteGuestPassword(slug: string, id: string): Promise<void> {
  const list = await load(slug);
  await save(slug, list.filter((g) => g.id !== id));
}

/** The vault slug whose guest password matches, or null. */
export async function findGuestSlugByPassword(password: string): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("site_content")
    .select("key, value")
    .like("key", `${PREFIX}%`)
    .returns<{ key: string; value: string | null }[]>();
  if (error || !data) return null;
  for (const row of data) {
    if (parse(row.value).some((g) => verifyPassword(password, g.hash))) return row.key.slice(PREFIX.length);
  }
  return null;
}
