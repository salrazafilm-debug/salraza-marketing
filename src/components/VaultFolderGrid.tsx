"use client";

import Link from "next/link";
import { useState } from "react";
import type { Folder, MediaItem } from "@/lib/clients";
import { DEFAULT_RATIO, clampRatio, widthStyle } from "@/components/VaultMediaGrid";

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

function countLabel(items: MediaItem[]): string {
  const photos = items.filter((item) => item.type === "image").length;
  const videos = items.length - photos;
  const parts: string[] = [];
  if (photos) parts.push(`${photos} photo${photos === 1 ? "" : "s"}`);
  if (videos) parts.push(`${videos} video${videos === 1 ? "" : "s"}`);
  return parts.join(" · ");
}

function FolderCard({ slug, folder, items }: { slug: string; folder: Folder; items: MediaItem[] }) {
  const [ratio, setRatio] = useState(DEFAULT_RATIO);
  const cover = getFolderCoverSrc(folder, items);
  const chosen = items.find((item) => item.id === folder.coverMediaId);
  // A video picked as the cover is premium: it takes a full-width row to itself.
  const featured = !folder.coverUrl && !!chosen?.externalUrl;

  return (
    <Link
      href={`/clients/${slug}/vault?folder=${folder.id}`}
      className="justified-item focus-brand group flex flex-col shadow-lg shadow-black/30 transition hover:-translate-y-1"
      style={featured ? { flexBasis: "100%", flexGrow: 0 } : widthStyle(ratio)}
    >
      <div className="relative w-full overflow-hidden bg-black" style={{ aspectRatio: `${ratio}` }}>
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt=""
            onLoad={(event) =>
              setRatio(clampRatio(event.currentTarget.naturalWidth, event.currentTarget.naturalHeight))
            }
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-golden-hour/60">Photos</div>
        )}
      </div>
      <div className="flex flex-1 flex-col items-center gap-1 p-5 text-center">
        {folder.eventDate && (
          <p className="text-caption uppercase tracking-wide text-golden-hour/80">{formatEventDate(folder.eventDate)}</p>
        )}
        <p className="text-subhead text-paper">{folder.name}</p>
        <p className="text-caption text-golden-hour/80">{countLabel(items)}</p>
        <span className="mt-3 inline-flex items-center rounded-full bg-highlighter px-6 py-3 text-label font-bold text-on-highlighter transition group-hover:brightness-95">
          Enter this day →
        </span>
      </div>
    </Link>
  );
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
  const visible = folders
    .map((folder) => ({ folder, items: media.filter((item) => item.folderId === folder.id) }))
    .filter(({ items }) => items.length > 0);

  return (
    <div className="justified">
      {visible.map(({ folder, items }) => (
        <FolderCard key={folder.id} slug={slug} folder={folder} items={items} />
      ))}
      <div aria-hidden className="justified-spacer" />
    </div>
  );
}
