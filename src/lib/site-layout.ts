import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { getSupabaseAdmin } from "@/lib/supabase";
import { DEFAULT_LAYOUT, parseLayout, type HomeLayout } from "@/components/site/layout-types";

/**
 * Editable site documents are stored as JSON text in the existing
 * `site_content` table (one row per key) — no new table or migration.
 *
 *   homepage-layout   what the live homepage shows (published)
 *   homepage-draft    the editor's work in progress (autosaved)
 *   homepage-history  the last published versions, newest first
 *   vault-look:<slug> one client's vault page look
 */
export const HOMEPAGE_LAYOUT_KEY = "homepage-layout";
export const HOMEPAGE_DRAFT_KEY = "homepage-draft";
export const HOMEPAGE_HISTORY_KEY = "homepage-history";
const HISTORY_MAX = 15;

// Local development without database settings: keep documents in temp
// files so the editor can still be tried out. Never used in production.
const storeInLocalFiles = () => process.env.NODE_ENV !== "production" && !process.env.SUPABASE_URL;
const localFile = (key: string) => path.join(os.tmpdir(), `salraza-${key.replace(/[^a-z0-9-]/gi, "_")}.json`);

export async function readJson(key: string): Promise<unknown> {
  let raw: string | null = null;
  if (storeInLocalFiles()) {
    raw = await fs.readFile(localFile(key), "utf8").catch(() => null);
  } else {
    const { data, error } = await getSupabaseAdmin()
      .from("site_content")
      .select("value")
      .eq("key", key)
      .maybeSingle<{ value: string | null }>();
    if (error) throw new Error(error.message);
    raw = data?.value ?? null;
  }
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function writeJson(key: string, value: unknown): Promise<void> {
  const text = JSON.stringify(value);
  if (storeInLocalFiles()) {
    await fs.writeFile(localFile(key), text, "utf8");
    return;
  }
  const { error } = await getSupabaseAdmin().from("site_content").upsert({
    key,
    kind: "text",
    value: text,
    cloudinary_public_id: null,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}

/** The live (published) homepage. */
export async function getHomepageLayout(): Promise<HomeLayout> {
  return parseLayout(await readJson(HOMEPAGE_LAYOUT_KEY)) ?? DEFAULT_LAYOUT;
}

/** The editor's draft, falling back to what's live. */
export async function getHomepageDraft(): Promise<HomeLayout> {
  return parseLayout(await readJson(HOMEPAGE_DRAFT_KEY)) ?? (await getHomepageLayout());
}

export async function saveHomepageDraft(layout: HomeLayout): Promise<void> {
  await writeJson(HOMEPAGE_DRAFT_KEY, layout);
}

export type HistoryEntry = { at: string; layout: HomeLayout };

export async function getHomepageHistory(): Promise<HistoryEntry[]> {
  const raw = await readJson(HOMEPAGE_HISTORY_KEY);
  if (!Array.isArray(raw)) return [];
  const out: HistoryEntry[] = [];
  for (const e of raw) {
    const layout = parseLayout((e as { layout?: unknown })?.layout);
    const at = (e as { at?: unknown })?.at;
    if (layout && typeof at === "string") out.push({ at, layout });
  }
  return out;
}

/** Makes the layout live, keeping the previous live version in history. */
export async function publishHomepage(layout: HomeLayout): Promise<void> {
  const previous = parseLayout(await readJson(HOMEPAGE_LAYOUT_KEY));
  if (previous) {
    const history = await getHomepageHistory();
    await writeJson(HOMEPAGE_HISTORY_KEY, [{ at: new Date().toISOString(), layout: previous }, ...history].slice(0, HISTORY_MAX));
  }
  await writeJson(HOMEPAGE_LAYOUT_KEY, layout);
  await writeJson(HOMEPAGE_DRAFT_KEY, layout);
}

/** Kept for older callers: publishing is the same as saving the live layout. */
export async function saveHomepageLayout(layout: HomeLayout): Promise<void> {
  await publishHomepage(layout);
}
