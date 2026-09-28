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
  image: string;
};

type Row = {
  id: string;
  title: string;
  category: PortfolioCategory;
  image: string;
  cloudinary_public_id: string | null;
};

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
  return data ?? [];
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
 * Deletes a portfolio item and returns its Cloudinary public ID so the
 * caller can also remove the file from Cloudinary — items seeded from the
 * original static images have no Cloudinary asset, so this can be null.
 */
export async function deletePortfolioItem(id: string): Promise<{ cloudinaryPublicId: string | null } | undefined> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("portfolio_items")
    .select("cloudinary_public_id")
    .eq("id", id)
    .maybeSingle<Pick<Row, "cloudinary_public_id">>();

  const { error } = await supabase.from("portfolio_items").delete().eq("id", id);
  if (error) throw new Error(error.message);

  return data ? { cloudinaryPublicId: data.cloudinary_public_id } : undefined;
}
