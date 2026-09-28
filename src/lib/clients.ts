import { getSupabaseAdmin } from "@/lib/supabase";
import { hashPassword, verifyPassword } from "@/lib/password";

export type MediaItem = {
  id: string;
  type: "image" | "video";
  label: string;
  caption: string | null;
  src: string;
  cloudinaryPublicId: string;
  folderId: string | null;
  /** Extra variant images alongside `src` (photos only — always [] for videos). */
  variants: string[];
};

export type MediaVariant = { id: string; image: string };

export type Folder = {
  id: string;
  name: string;
};

export type Client = {
  id: string;
  slug: string;
  name: string;
  /** A `salt:hash` string produced by hashPassword() — never a plaintext password. */
  passwordHash: string;
  welcomeNote: string;
  media: MediaItem[];
  folders: Folder[];
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
  folder_id: string | null;
};

type FolderRow = {
  id: string;
  client_id: string;
  name: string;
  position: number;
};

function toMediaItem(row: MediaRow, variants: string[]): MediaItem {
  return {
    id: row.id,
    type: row.type,
    label: row.label,
    caption: row.caption,
    src: row.src,
    cloudinaryPublicId: row.cloudinary_public_id,
    folderId: row.folder_id,
    variants,
  };
}

type MediaVariantRow = { id: string; media_item_id: string; image: string; cloudinary_public_id: string };

/**
 * Fetches every extra variant for the given media item ids, grouped by
 * media_item_id. Soft-fails to an empty map if media_item_variants doesn't
 * exist yet, so callers work fine before that table is created — items
 * just show as having no variants.
 */
async function fetchMediaVariantsByItem(mediaItemIds: string[]): Promise<Map<string, MediaVariantRow[]>> {
  const map = new Map<string, MediaVariantRow[]>();
  if (mediaItemIds.length === 0) return map;

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("media_item_variants")
    .select("id, media_item_id, image, cloudinary_public_id")
    .in("media_item_id", mediaItemIds)
    .order("position", { ascending: true })
    .returns<MediaVariantRow[]>();

  for (const row of data ?? []) {
    const list = map.get(row.media_item_id) ?? [];
    list.push(row);
    map.set(row.media_item_id, list);
  }
  return map;
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

  const variantsByItem = await fetchMediaVariantsByItem((mediaRows ?? []).map((row) => row.id));

  const { data: folderRows, error: folderError } = await supabase
    .from("folders")
    .select("*")
    .eq("client_id", clientRow.id)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true })
    .returns<FolderRow[]>();

  if (folderError) throw new Error(folderError.message);

  return {
    id: clientRow.id,
    slug: clientRow.slug,
    name: clientRow.name,
    passwordHash: clientRow.password_hash,
    welcomeNote: clientRow.welcome_note,
    media: (mediaRows ?? []).map((row) =>
      toMediaItem(
        row,
        (variantsByItem.get(row.id) ?? []).map((variant) => variant.image)
      )
    ),
    folders: (folderRows ?? []).map((row) => ({ id: row.id, name: row.name })),
  };
}

/**
 * Checks a plaintext password against every client's primary hash, plus
 * every extra password in client_passwords, and returns the matching
 * client's slug, or null. Client passwords are per-vault, not looked up by
 * slug first, so there's no way to avoid checking each one.
 */
export async function findClientSlugByPassword(password: string): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("clients")
    .select("slug, password_hash")
    .returns<Pick<ClientRow, "slug" | "password_hash">[]>();

  if (error || !data) return null;

  const primaryMatch = data.find((row) => verifyPassword(password, row.password_hash));
  if (primaryMatch) return primaryMatch.slug;

  const { data: extraRows, error: extraError } = await supabase
    .from("client_passwords")
    .select("password_hash, clients(slug)")
    .returns<{ password_hash: string; clients: { slug: string } | null }[]>();

  if (extraError || !extraRows) return null;

  const extraMatch = extraRows.find((row) => verifyPassword(password, row.password_hash));
  return extraMatch?.clients?.slug ?? null;
}

/** Lists a client's extra passwords (id + when added — never the plaintext, which isn't stored). */
export async function listClientPasswords(
  clientSlug: string
): Promise<{ id: string; createdAt: string }[]> {
  const supabase = getSupabaseAdmin();
  const { data: clientRow } = await supabase
    .from("clients")
    .select("id")
    .eq("slug", clientSlug)
    .maybeSingle<{ id: string }>();

  if (!clientRow) return [];

  // Soft-fails (returns []) rather than throwing if client_passwords doesn't
  // exist yet — this list is a nice-to-have on the admin client page, and a
  // missing table there shouldn't break loading a client's other settings.
  const { data, error } = await supabase
    .from("client_passwords")
    .select("id, created_at")
    .eq("client_id", clientRow.id)
    .order("created_at", { ascending: true })
    .returns<{ id: string; created_at: string }[]>();

  if (error) return [];
  return (data ?? []).map((row) => ({ id: row.id, createdAt: row.created_at }));
}

/** Adds an extra password that unlocks the same vault as the client's primary password. */
export async function addClientPassword(clientSlug: string, password: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { data: clientRow, error: clientError } = await supabase
    .from("clients")
    .select("id")
    .eq("slug", clientSlug)
    .maybeSingle<{ id: string }>();

  if (clientError || !clientRow) throw new Error("Family not found.");

  const { error } = await supabase
    .from("client_passwords")
    .insert({ client_id: clientRow.id, password_hash: hashPassword(password) });

  if (error) throw new Error(error.message);
}

/** Removes one of a client's extra passwords. */
export async function deleteClientPassword(id: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("client_passwords").delete().eq("id", id);
  if (error) throw new Error(error.message);
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

/** Adds a media item (already uploaded to Cloudinary) to a client's gallery, optionally inside a folder. */
export async function addMediaItem(
  clientSlug: string,
  item: {
    type: "image" | "video";
    label: string;
    caption?: string;
    src: string;
    cloudinaryPublicId: string;
    folderId?: string | null;
  }
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { data: clientRow, error: clientError } = await supabase
    .from("clients")
    .select("id")
    .eq("slug", clientSlug)
    .maybeSingle<{ id: string }>();

  if (clientError || !clientRow) throw new Error("Family not found.");

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
    folder_id: item.folderId || null,
  });

  if (error) throw new Error(error.message);
}

/** Creates a new (initially empty) folder in a client's gallery. */
export async function createFolder(clientSlug: string, name: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { data: clientRow, error: clientError } = await supabase
    .from("clients")
    .select("id")
    .eq("slug", clientSlug)
    .maybeSingle<{ id: string }>();

  if (clientError || !clientRow) throw new Error("Family not found.");

  const { count } = await supabase
    .from("folders")
    .select("id", { count: "exact", head: true })
    .eq("client_id", clientRow.id);

  const { error } = await supabase
    .from("folders")
    .insert({ client_id: clientRow.id, name, position: count ?? 0 });

  if (error) throw new Error(error.message);
}

/**
 * Deletes a folder and everything in it (the DB rows cascade automatically).
 * Returns the deleted items' Cloudinary info so the caller can also remove
 * those files from Cloudinary, which the database has no way to do itself.
 */
export async function deleteFolder(
  id: string
): Promise<{ cloudinaryPublicId: string; type: "image" | "video" }[]> {
  const supabase = getSupabaseAdmin();

  const { data: mediaRows } = await supabase
    .from("media_items")
    .select("cloudinary_public_id, type")
    .eq("folder_id", id)
    .returns<Pick<MediaRow, "cloudinary_public_id" | "type">[]>();

  const { error } = await supabase.from("folders").delete().eq("id", id);
  if (error) throw new Error(error.message);

  return (mediaRows ?? []).map((row) => ({
    cloudinaryPublicId: row.cloudinary_public_id,
    type: row.type,
  }));
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

/** Lists every media item's extra variants for a client, grouped by media item id — for the admin manager. */
export async function listMediaVariantsByClient(
  clientSlug: string
): Promise<Record<string, MediaVariant[]>> {
  const supabase = getSupabaseAdmin();
  const { data: clientRow } = await supabase
    .from("clients")
    .select("id")
    .eq("slug", clientSlug)
    .maybeSingle<{ id: string }>();

  if (!clientRow) return {};

  const { data: mediaRows } = await supabase
    .from("media_items")
    .select("id")
    .eq("client_id", clientRow.id)
    .returns<{ id: string }[]>();

  const variantsByItem = await fetchMediaVariantsByItem((mediaRows ?? []).map((row) => row.id));

  const result: Record<string, MediaVariant[]> = {};
  for (const [itemId, rows] of variantsByItem) {
    result[itemId] = rows.map((row) => ({ id: row.id, image: row.image }));
  }
  return result;
}

/** Lists a media item's extra variants with their Cloudinary public IDs — used to clean up Cloudinary before deleting the item. */
export async function listMediaVariants(
  mediaItemId: string
): Promise<{ id: string; cloudinaryPublicId: string }[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("media_item_variants")
    .select("id, cloudinary_public_id")
    .eq("media_item_id", mediaItemId)
    .returns<{ id: string; cloudinary_public_id: string }[]>();

  if (error) return [];
  return (data ?? []).map((row) => ({ id: row.id, cloudinaryPublicId: row.cloudinary_public_id }));
}

/** Adds an extra variant image to a media item. */
export async function addMediaVariant(
  mediaItemId: string,
  image: string,
  cloudinaryPublicId: string
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { count } = await supabase
    .from("media_item_variants")
    .select("id", { count: "exact", head: true })
    .eq("media_item_id", mediaItemId);

  const { error } = await supabase.from("media_item_variants").insert({
    media_item_id: mediaItemId,
    image,
    cloudinary_public_id: cloudinaryPublicId,
    position: count ?? 0,
  });

  if (error) throw new Error(error.message);
}

/** Removes an extra variant and returns its Cloudinary public ID for cleanup. */
export async function deleteMediaVariant(id: string): Promise<{ cloudinaryPublicId: string } | undefined> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("media_item_variants")
    .select("cloudinary_public_id")
    .eq("id", id)
    .maybeSingle<{ cloudinary_public_id: string }>();

  const { error } = await supabase.from("media_item_variants").delete().eq("id", id);
  if (error) throw new Error(error.message);

  return data ? { cloudinaryPublicId: data.cloudinary_public_id } : undefined;
}

/**
 * Reassigns sequential positions (0, 1, 2, ...) to media items in the given
 * order, e.g. after an admin drags photos into a new arrangement. Only the
 * items in `orderedIds` are touched — since display always filters by
 * folder first, positions only need to be consistent within that filtered
 * list, not globally unique across a client's whole gallery.
 */
export async function reorderMediaItems(orderedIds: string[]): Promise<void> {
  const supabase = getSupabaseAdmin();
  const results = await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("media_items").update({ position: index }).eq("id", id)
    )
  );
  const failed = results.find((result) => result.error);
  if (failed?.error) throw new Error(failed.error.message);
}
