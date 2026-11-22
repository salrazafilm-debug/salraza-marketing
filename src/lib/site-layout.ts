import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { getSupabaseAdmin } from "@/lib/supabase";
import { DEFAULT_LAYOUT, parseLayout, type HomeLayout } from "@/components/site/layout-types";

/**
 * The homepage layout (section order, hidden sections, edited words) is stored
 * as JSON in the existing `site_content` table under this key — no new table
 * or migration needed.
 */
export const HOMEPAGE_LAYOUT_KEY = "homepage-layout";

// Local development without database settings: keep the layout in a temp
// file instead, so the site editor can still be tried out. Never used in
// production (where missing settings should fail loudly).
const storeInLocalFile = () => process.env.NODE_ENV !== "production" && !process.env.SUPABASE_URL;
const LOCAL_FILE = path.join(os.tmpdir(), "salraza-homepage-layout.json");

export async function getHomepageLayout(): Promise<HomeLayout> {
  let raw: string | null = null;
  if (storeInLocalFile()) {
    raw = await fs.readFile(LOCAL_FILE, "utf8").catch(() => null);
  } else {
    const { data, error } = await getSupabaseAdmin()
      .from("site_content")
      .select("value")
      .eq("key", HOMEPAGE_LAYOUT_KEY)
      .maybeSingle<{ value: string | null }>();
    if (error) throw new Error(error.message);
    raw = data?.value ?? null;
  }
  if (!raw) return DEFAULT_LAYOUT;
  try {
    return parseLayout(JSON.parse(raw)) ?? DEFAULT_LAYOUT;
  } catch {
    return DEFAULT_LAYOUT;
  }
}

export async function saveHomepageLayout(layout: HomeLayout): Promise<void> {
  const value = JSON.stringify(layout);
  if (storeInLocalFile()) {
    await fs.writeFile(LOCAL_FILE, value, "utf8");
    return;
  }
  const { error } = await getSupabaseAdmin().from("site_content").upsert({
    key: HOMEPAGE_LAYOUT_KEY,
    kind: "text",
    value,
    cloudinary_public_id: null,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}
