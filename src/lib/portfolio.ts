import { getSupabaseAdmin } from "@/lib/supabase";

export type PortfolioCategory = "Social media" | "Photography" | "Short-form video";

export const PORTFOLIO_CATEGORIES: PortfolioCategory[] = [
  "Social media",
  "Photography",
  "Short-form video",
];

export type PortfolioItem = {
  id: string;
  title: string;
  category: PortfolioCategory;
  /** The primary image (images[0]) plus any extra variants, in display order. */
  images: string[];
};

export type PortfolioVariant = { id: string; image: string };

type Row = {
  id: string;
  title: string;
  category: PortfolioCategory;
  image: string;
  cloudinary_public_id: string | null;
};

type VariantRow = {
  id: string;
  portfolio_item_id: string;
  image: string;
  cloudinary_public_id: string;
};

/**
 * Fetches every extra variant, grouped by portfolio item id. Soft-fails to
 * an empty map if portfolio_item_variants doesn't exist yet, so callers work
 * fine before that table is created — items just show as having no variants.
 */
async function fetchVariantsByItem(): Promise<Map<string, VariantRow[]>> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("portfolio_item_variants")
    .select("id, portfolio_item_id, image, cloudinary_public_id")
    .order("position", { ascending: true })
    .returns<VariantRow[]>();

  const map = new Map<string, VariantRow[]>();
  for (const row of data ?? []) {
    const list = map.get(row.portfolio_item_id) ?? [];
    list.push(row);
    map.set(row.portfolio_item_id, list);
  }
  return map;
}

/** Lists every portfolio item in display order, for the public /portfolio page and homepage. */
export async function listPortfolioItems(): Promise<PortfolioItem[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("portfolio_items")
    .select("id, title, category, image")
    .order("position", { ascending: true })
    .order("created_at", { ascending: true })
    .returns<Pick<Row, "id" | "title" | "category" | "image">[]>();

  if (error) throw new Error(error.message);

  const variantsByItem = await fetchVariantsByItem();

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    category: row.category,
    images: [row.image, ...(variantsByItem.get(row.id) ?? []).map((v) => v.image)],
  }));
}

/** Lists every extra variant for every item, grouped by item id — for the admin manager. */
export async function listPortfolioVariantsByItem(): Promise<Record<string, PortfolioVariant[]>> {
  const variantsByItem = await fetchVariantsByItem();
  const result: Record<string, PortfolioVariant[]> = {};
  for (const [itemId, rows] of variantsByItem) {
    result[itemId] = rows.map((row) => ({ id: row.id, image: row.image }));
  }
  return result;
}

/** Adds an extra variant image to a portfolio item. */
export async function addPortfolioVariant(
  itemId: string,
  image: string,
  cloudinaryPublicId: string
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { count } = await supabase
    .from("portfolio_item_variants")
    .select("id", { count: "exact", head: true })
    .eq("portfolio_item_id", itemId);

  const { error } = await supabase.from("portfolio_item_variants").insert({
    portfolio_item_id: itemId,
    image,
    cloudinary_public_id: cloudinaryPublicId,
    position: count ?? 0,
  });

  if (error) throw new Error(error.message);
}

/** Removes an extra variant and returns its Cloudinary public ID for cleanup. */
export async function deletePortfolioVariant(
  id: string
): Promise<{ cloudinaryPublicId: string } | undefined> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("portfolio_item_variants")
    .select("cloudinary_public_id")
    .eq("id", id)
    .maybeSingle<Pick<VariantRow, "cloudinary_public_id">>();

  const { error } = await supabase.from("portfolio_item_variants").delete().eq("id", id);
  if (error) throw new Error(error.message);

  return data ? { cloudinaryPublicId: data.cloudinary_public_id } : undefined;
}

/** Adds a portfolio item (already uploaded to Cloudinary) to the end of the list. */
export async function addPortfolioItem(item: {
  title: string;
  category: PortfolioCategory;
  image: string;
  cloudinaryPublicId: string;
}): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { count } = await supabase
    .from("portfolio_items")
    .select("id", { count: "exact", head: true });

  const { error } = await supabase.from("portfolio_items").insert({
    title: item.title,
    category: item.category,
    image: item.image,
    cloudinary_public_id: item.cloudinaryPublicId,
    position: count ?? 0,
  });

  if (error) throw new Error(error.message);
}

/**
 * Reassigns sequential positions (0, 1, 2, ...) to portfolio items in the
 * given order, e.g. after an admin moves one up or down in the list.
 */
export async function reorderPortfolioItems(orderedIds: string[]): Promise<void> {
  const supabase = getSupabaseAdmin();
  const results = await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("portfolio_items").update({ position: index }).eq("id", id)
    )
  );
  const failed = results.find((result) => result.error);
  if (failed?.error) throw new Error(failed.error.message);
}

/**
 * Deletes a portfolio item (its variant rows cascade-delete with it) and
 * returns every Cloudinary public ID involved — the primary image (items
 * seeded from the original static images have none, so that can be null)
 * plus every variant's — so the caller can clean those up from Cloudinary
 * too, which the database has no way to do itself.
 */
export async function deletePortfolioItem(
  id: string
): Promise<{ cloudinaryPublicId: string | null; variantCloudinaryPublicIds: string[] } | undefined> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("portfolio_items")
    .select("cloudinary_public_id")
    .eq("id", id)
    .maybeSingle<Pick<Row, "cloudinary_public_id">>();

  if (!data) return undefined;

  const { data: variantRows } = await supabase
    .from("portfolio_item_variants")
    .select("cloudinary_public_id")
    .eq("portfolio_item_id", id)
    .returns<Pick<VariantRow, "cloudinary_public_id">[]>();

  const { error } = await supabase.from("portfolio_items").delete().eq("id", id);
  if (error) throw new Error(error.message);

  return {
    cloudinaryPublicId: data.cloudinary_public_id,
    variantCloudinaryPublicIds: (variantRows ?? []).map((row) => row.cloudinary_public_id),
  };
}
