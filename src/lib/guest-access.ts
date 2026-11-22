import { randomBytes } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase";
import { hashPassword, verifyPassword } from "@/lib/password";

/**
 * Guest passwords: they open a vault but only show the folder covers (locked).
 * Stored per client in the existing site_content table (one JSON row per
 * client), so no database change is needed. Only password hashes are kept.
 */
type Guest = { id: string; hash: string; createdAt: string; /** Folder ids this password may open; everything else stays locked. */ folders: string[] };

const PREFIX = "guest-pw:";
const keyFor = (slug: string) => `${PREFIX}${slug}`;

function parse(value: string | null): Guest[] {
  if (!value) return [];
  try {
    const list = JSON.parse(value);
    return Array.isArray(list)
      ? list
          .filter((g) => g && typeof g.id === "string" && typeof g.hash === "string" && typeof g.createdAt === "string")
          .map((g): Guest => ({ id: g.id, hash: g.hash, createdAt: g.createdAt, folders: Array.isArray(g.folders) ? g.folders.filter((f: unknown) => typeof f === "string") : [] }))
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

export async function listGuestPasswords(slug: string): Promise<{ id: string; createdAt: string; folders: string[] }[]> {
  try {
    return (await load(slug)).map((g) => ({ id: g.id, createdAt: g.createdAt, folders: g.folders }));
  } catch {
    return [];
  }
}

export async function addGuestPassword(slug: string, password: string): Promise<void> {
  const list = await load(slug);
  list.push({ id: randomBytes(6).toString("hex"), hash: hashPassword(password), createdAt: new Date().toISOString(), folders: [] });
  await save(slug, list);
}

export async function deleteGuestPassword(slug: string, id: string): Promise<void> {
  const list = await load(slug);
  await save(slug, list.filter((g) => g.id !== id));
}

/** Which folders this guest password may open (null = the password no longer exists). */
export async function getGuestFolders(slug: string, id: string): Promise<string[] | null> {
  const g = (await load(slug)).find((x) => x.id === id);
  return g ? g.folders : null;
}

export async function setGuestFolders(slug: string, id: string, folders: string[]): Promise<void> {
  const list = await load(slug);
  if (!list.some((g) => g.id === id)) throw new Error("Guest password not found.");
  await save(slug, list.map((g) => (g.id === id ? { ...g, folders } : g)));
}

/** The vault and guest password id that match, or null. */
export async function findGuestByPassword(password: string): Promise<{ slug: string; id: string } | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("site_content")
    .select("key, value")
    .like("key", `${PREFIX}%`)
    .returns<{ key: string; value: string | null }[]>();
  if (error || !data) return null;
  for (const row of data) {
    const hit = parse(row.value).find((g) => verifyPassword(password, g.hash));
    if (hit) return { slug: row.key.slice(PREFIX.length), id: hit.id };
  }
  return null;
}
