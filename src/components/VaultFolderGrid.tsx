"use client";

import Link from "next/link";
import { useState } from "react";
import type { Folder, MediaItem } from "@/lib/clients";
import { DEFAULT_RATIO, JustifiedRows, clampRatio, type JustifyItem } from "@/components/JustifiedRows";

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

function FolderCard({
  slug,
  folder,
  items,
  width,
  height,
  onRatio,
}: {
  slug: string;
  folder: Folder;
  items: MediaItem[];
  width: number;
  height: number;
  onRatio: (id: string, ratio: number) => void;
}) {
  const cover = getFolderCoverSrc(folder, items);

  return (
    <Link
      href={`/clients/${slug}/vault?folder=${folder.id}`}
      className="justified-item focus-brand group flex flex-col shadow-lg shadow-black/30 transition hover:-translate-y-1"
      style={{ width }}
    >
      <div className="relative w-full overflow-hidden bg-black" style={{ height }}>
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt=""
            onLoad={(event) =>
              onRatio(folder.id, clampRatio(event.currentTarget.naturalWidth, event.currentTarget.naturalHeight))
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
  const [ratios, setRatios] = useState<Record<string, number>>({});
  const onRatio = (id: string, ratio: number) =>
    setRatios((prev) => (prev[id] === ratio ? prev : { ...prev, [id]: ratio }));

  const visible = folders
    .map((folder) => ({ folder, items: media.filter((item) => item.folderId === folder.id) }))
    .filter(({ items }) => items.length > 0);

  const layoutItems: JustifyItem[] = visible.map(({ folder, items }) => {
    const chosen = items.find((item) => item.id === folder.coverMediaId);
    return {
      key: folder.id,
      ratio: ratios[folder.id] ?? DEFAULT_RATIO,
      // A video picked as the cover is premium: it takes a full-width row to itself.
      solo: !folder.coverUrl && !!chosen?.externalUrl,
      render: (width, height) => (
        <FolderCard slug={slug} folder={folder} items={items} width={width} height={height} onRatio={onRatio} />
      ),
    };
  });

  return (
    <JustifiedRows
      items={layoutItems}
      gap={16}
      fallbackHeight={260}
      // Day cards are shown larger than the media tiles, so each day reads clearly.
      targetHeight={(width) => (width < 640 ? 260 : 360)}
    />
  );
}
