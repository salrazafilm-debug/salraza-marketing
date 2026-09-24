import { getSupabaseAdmin } from "@/lib/supabase";
import { hashPassword, verifyPassword } from "@/lib/password";

export type MediaItem = {
  id: string;
  type: "image" | "video";
  label: string;
  caption: string | null;
  src: string;
  cloudinaryPublicId: string;
};

export type Client = {
  id: string;
  slug: string;
  name: string;
  /** A `salt:hash` string produced by hashPassword() — never a plaintext password. */
  passwordHash: string;
  welcomeNote: string;
  media: MediaItem[];
};

export type ClientSummary = Pick<Client, "id" | "slug" | "name" | "welcomeNote"> & {
  mediaCount: number;
};

type ClientRow = {
  id: string;
  slug: string;
  name: string;
  password_hash: string;
  welcome_note: string;
};

type MediaRow = {
  id: string;
  client_id: string;
  type: "image" | "video";
  label: string;
  caption: string | null;
  src: string;
  cloudinary_public_id: string;
  position: number;
};

function toMediaItem(row: MediaRow): MediaItem {
  return {
    id: row.id,
    type: row.type,
    label: row.label,
    caption: row.caption,
    src: row.src,
    cloudinaryPublicId: row.cloudinary_public_id,
  };
}

/** Looks up a client vault by its URL slug, with its media items in display order. */
export async function findClientBySlug(slug: string): Promise<Client | undefined> {
  const supabase = getSupabaseAdmin();

  const { data: clientRow, error: clientError } = await supabase
    .from("clients")
    .select("*")
    .eq("slug", slug)
    .maybeSingle<ClientRow>();

  if (clientError || !clientRow) return undefined;

  const { data: mediaRows, error: mediaError } = await supabase
    .from("media_items")
    .select("*")
    .eq("client_id", clientRow.id)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true })
    .returns<MediaRow[]>();

  if (mediaError) throw new Error(mediaError.message);

  return {
    id: clientRow.id,
    slug: clientRow.slug,
    name: clientRow.name,
    passwordHash: clientRow.password_hash,
    welcomeNote: clientRow.welcome_note,
    media: (mediaRows ?? []).map(toMediaItem),
  };
}

/**
 * Checks a plaintext password against every client's hash and returns the
 * matching client's slug, or null. Client passwords are per-vault, not
 * looked up by slug first, so there's no way to avoid checking each one.
 */
export async function findClientSlugByPassword(password: string): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("clients")
    .select("slug, password_hash")
    .returns<Pick<ClientRow, "slug" | "password_hash">[]>();

  if (error || !data) return null;

  const match = data.find((row) => verifyPassword(password, row.password_hash));
  return match?.slug ?? null;
}

/** Lists every client vault with a media count, for the admin dashboard. */
export async function listClientSummaries(): Promise<ClientSummary[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("clients")
    .select("id, slug, name, welcome_note, media_items(count)")
    .order("name", { ascending: true })
    .returns<(ClientRow & { media_items: { count: number }[] })[]>();

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    welcomeNote: row.welcome_note,
    mediaCount: row.media_items?.[0]?.count ?? 0,
  }));
}

/** Creates a new client vault. Throws if the slug is already taken. */
export async function createClient(input: {
  slug: string;
  name: string;
  password: string;
  welcomeNote: string;
}): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("clients").insert({
    slug: input.slug,
    name: input.name,
    password_hash: hashPassword(input.password),
    welcome_note: input.welcomeNote,
  });

  if (error) {
    if (error.code === "23505") throw new Error(`"${input.slug}" is already in use.`);
    throw new Error(error.message);
  }
}

/** Updates a client's name, welcome note, and/or password (only the given fields change). */
export async function updateClient(
  slug: string,
  updates: { name?: string; welcomeNote?: string; password?: string }
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const patch: Record<string, string> = {};
  if (updates.name !== undefined) patch.name = updates.name;
  if (updates.welcomeNote !== undefined) patch.welcome_note = updates.welcomeNote;
  if (updates.password) patch.password_hash = hashPassword(updates.password);

  if (Object.keys(patch).length === 0) return;

  const { error } = await supabase.from("clients").update(patch).eq("slug", slug);
  if (error) throw new Error(error.message);
}

/** Deletes a client vault and all of its media item rows (not the Cloudinary assets). */
export async function deleteClient(slug: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("clients").delete().eq("slug", slug);
  if (error) throw new Error(error.message);
}

/** Adds a media item (already uploaded to Cloudinary) to a client's gallery. */
export async function addMediaItem(
  clientSlug: string,
  item: {
    type: "image" | "video";
    label: string;
    caption?: string;
    src: string;
    cloudinaryPublicId: string;
  }
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { data: clientRow, error: clientError } = await supabase
    .from("clients")
    .select("id")
    .eq("slug", clientSlug)
    .maybeSingle<{ id: string }>();

  if (clientError || !clientRow) throw new Error("Client not found.");

  const { count } = await supabase
    .from("media_items")
    .select("id", { count: "exact", head: true })
    .eq("client_id", clientRow.id);

  const { error } = await supabase.from("media_items").insert({
    client_id: clientRow.id,
    type: item.type,
    label: item.label,
    caption: item.caption || null,
    src: item.src,
    cloudinary_public_id: item.cloudinaryPublicId,
    position: count ?? 0,
  });

  if (error) throw new Error(error.message);
}

/** Updates a media item's label and/or caption. */
export async function updateMediaItem(
  id: string,
  updates: { label?: string; caption?: string }
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const patch: Record<string, string | null> = {};
  if (updates.label !== undefined) patch.label = updates.label;
  if (updates.caption !== undefined) patch.caption = updates.caption || null;

  if (Object.keys(patch).length === 0) return;

  const { error } = await supabase.from("media_items").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

/** Looks up a single media item by id (used to get its Cloudinary public ID before deleting). */
export async function findMediaItem(
  id: string
): Promise<{ id: string; cloudinaryPublicId: string; type: "image" | "video" } | undefined> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("media_items")
    .select("id, cloudinary_public_id, type")
    .eq("id", id)
    .maybeSingle<Pick<MediaRow, "id" | "cloudinary_public_id" | "type">>();

  if (error || !data) return undefined;
  return { id: data.id, cloudinaryPublicId: data.cloudinary_public_id, type: data.type };
}

/** Deletes a media item row (call deleteCloudinaryAsset separately to remove the file itself). */
export async function deleteMediaItem(id: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("media_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
