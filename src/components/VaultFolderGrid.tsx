"use client";

import Link from "next/link";
import type { Folder, MediaItem } from "@/lib/clients";
import { folderCountLabel, formatEventDate, getFolderCoverSrc } from "@/lib/vault-folder-utils";

/**
 * Every folder is its own hero: one per row, full width, at a generous fixed
 * shape (never shrunk to fit two or three across).
 */
function FolderCard({ slug, folder, items }: { slug: string; folder: Folder; items: MediaItem[] }) {
  const cover = getFolderCoverSrc(folder, items);

  return (
    <Link
      href={`/clients/${slug}/vault?folder=${folder.id}`}
      className="focus-brand group flex w-full flex-col shadow-lg shadow-black/30 transition hover:-translate-y-1"
    >
      <div className="relative w-full overflow-hidden bg-black sm:aspect-[16/9] sm:max-h-[78svh]">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt=""
            className="block h-auto w-full transition-transform duration-500 group-hover:scale-[1.02] sm:absolute sm:inset-0 sm:h-full sm:object-cover"
          />
        ) : (
          <div className="flex aspect-[4/3] w-full items-center justify-center text-golden-hour/60 sm:aspect-auto sm:h-full">Photos</div>
        )}
      </div>
      <div className="flex flex-1 flex-col items-center gap-1 p-5 text-center sm:p-6">
        {folder.eventDate && (
          <p className="text-caption uppercase tracking-wide text-golden-hour/80">{formatEventDate(folder.eventDate)}</p>
        )}
        {/* The card is always dark (espresso), so the name stays light in both modes. */}
        <p className="text-subhead text-[#f4efe9]">{folder.name}</p>
        <p className="text-caption text-golden-hour/80">{folderCountLabel(items)}</p>
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
    <div className="flex flex-col gap-6 sm:gap-8">
      {visible.map(({ folder, items }) => (
        <FolderCard key={folder.id} slug={slug} folder={folder} items={items} />
      ))}
    </div>
  );
}
