import Link from "next/link";
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

/** The folder thumbnail: the chosen cover, else the first photo, else a linked video's thumbnail. */
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

function countLabel(items: MediaItem[]): string {
  const photos = items.filter((item) => item.type === "image").length;
  const videos = items.length - photos;
  const parts: string[] = [];
  if (photos) parts.push(`${photos} photo${photos === 1 ? "" : "s"}`);
  if (videos) parts.push(`${videos} video${videos === 1 ? "" : "s"}`);
  return parts.join(" · ");
}

export function VaultFolderGrid({
  slug,
  folders,
  media,
}: {
  slug: string;
  folders: Folder[];
  media: MediaItem[];
}) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {folders.map((folder) => {
        const items = media.filter((item) => item.folderId === folder.id);
        if (items.length === 0) return null;
        const cover = getFolderCoverSrc(folder, items);
        const chosen = items.find((item) => item.id === folder.coverMediaId);
        // A video chosen as the cover is premium: it gets its own full-width row.
        const featured = !folder.coverUrl && !!chosen?.externalUrl;
        return (
          <Link
            key={folder.id}
            href={`/clients/${slug}/vault?folder=${folder.id}`}
            className={`focus-brand group flex flex-col overflow-hidden rounded-xl bg-espresso shadow-lg shadow-black/30 transition hover:-translate-y-1 ${
              featured ? "sm:col-span-2 lg:col-span-3" : ""
            }`}
          >
            <div className="relative w-full overflow-hidden bg-black">
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cover}
                  alt=""
                  className="block h-auto w-full transition-transform duration-500 group-hover:scale-[1.02]"
                />
              ) : (
                <div className="flex aspect-[4/5] w-full items-center justify-center text-golden-hour/60">Photos</div>
              )}
            </div>
            <div className="flex flex-1 flex-col items-center gap-1 p-5 text-center">
              {folder.eventDate && (
                <p className="text-caption uppercase tracking-wide text-golden-hour/80">
                  {formatEventDate(folder.eventDate)}
                </p>
              )}
              <p className="text-subhead text-paper">{folder.name}</p>
              <p className="text-caption text-golden-hour/80">{countLabel(items)}</p>
              <span className="mt-3 inline-flex items-center rounded-full bg-highlighter px-6 py-3 text-label font-bold text-on-highlighter transition group-hover:brightness-95">
                Enter this day →
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
