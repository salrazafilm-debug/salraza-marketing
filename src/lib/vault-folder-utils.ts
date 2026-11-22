import type { Folder, MediaItem } from "@/lib/clients";

/** "Saturday, November 1, 2025" from a YYYY-MM-DD string (UTC, so it never shifts a day). */
export function formatEventDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** The folder thumbnail: the custom cover, else the chosen cover, else the first photo, else a linked video's thumbnail. */
export function getFolderCoverSrc(folder: Folder, items: MediaItem[]): string | null {
  const thumbOf = (item: MediaItem) => (item.externalUrl ? item.thumbnailUrl : item.type === "image" ? item.src : null);
  if (folder.coverUrl) return folder.coverUrl;
  const chosen = folder.coverMediaId ? items.find((item) => item.id === folder.coverMediaId) : undefined;
  if (chosen) {
    const src = thumbOf(chosen);
    if (src) return src;
  }
  const firstImage = items.find((item) => item.type === "image");
  if (firstImage) return firstImage.src;
  return items.map(thumbOf).find((src): src is string => Boolean(src)) ?? null;
}
