import Link from "next/link";
import type { Folder, MediaItem } from "@/lib/clients";
import { getVideoThumbnailUrl } from "@/lib/cloudinary";

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
  const chosen = folder.coverMediaId ? items.find((item) => item.id === folder.coverMediaId) : undefined;
  if (chosen) {
    const src = thumbOf(chosen);
    if (src) return src;
  }
  const firstImage = items.find((item) => item.type === "image");
  if (firstImage) return firstImage.src;
  return items.map(thumbOf).find((src): src is string => Boolean(src)) ?? null;
}

/** One video thumbnail for the folder: a linked video's custom thumbnail, or an uploaded video's poster frame. */
function getFolderVideoThumb(items: MediaItem[]): string | null {
  const video = items.find((item) => item.type === "video");
  if (!video) return null;
  return video.externalUrl ? video.thumbnailUrl : getVideoThumbnailUrl(video.cloudinaryPublicId);
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
        const videoThumb = getFolderVideoThumb(items);
        return (
          <Link
            key={folder.id}
            href={`/clients/${slug}/vault?folder=${folder.id}`}
            className="focus-brand group flex flex-col overflow-hidden rounded-xl bg-espresso shadow-lg shadow-black/30 transition hover:-translate-y-1"
          >
            <div className={`grid gap-px bg-black ${videoThumb ? "grid-cols-2" : "grid-cols-1"}`}>
              <div className="relative aspect-[4/5] overflow-hidden">
                {cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cover}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-golden-hour/60">Photos</div>
                )}
              </div>
              {videoThumb && (
                <div className="relative aspect-[4/5] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={videoThumb}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-espresso/75 text-golden-hour backdrop-blur">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                </div>
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
