"use client";

import Link from "next/link";
import { useState } from "react";
import { DEFAULT_RATIO, JustifiedRows, clampRatio, type JustifyItem } from "@/components/JustifiedRows";

/** Only what a guest may see: cover, name, date. No media is ever passed in. */
export type LockedFolder = {
  id: string;
  name: string;
  dateLabel: string | null;
  cover: string | null;
  /** True = this guest may open it; false = locked. */
  open: boolean;
  href: string;
  countLabel: string;
};

function LockedCard({
  folder,
  width,
  height,
  onRatio,
}: {
  folder: LockedFolder;
  width: number;
  height: number;
  onRatio: (id: string, ratio: number) => void;
}) {
  const inner = (
    <>
      <div className="relative w-full overflow-hidden bg-black" style={{ height }}>
        {folder.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={folder.cover}
            alt=""
            onLoad={(event) => onRatio(folder.id, clampRatio(event.currentTarget.naturalWidth, event.currentTarget.naturalHeight))}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="h-full w-full bg-[#1d0b11]" />
        )}
        {!folder.open && (
          <>
            <div className="absolute inset-0 bg-black/25" />
            {/* The lock sits in the middle of the cover. */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-20 w-20 items-center justify-center rounded-full border border-white/25 bg-black/55 text-white shadow-2xl backdrop-blur-sm sm:h-24 sm:w-24">
                <svg width="38" height="38" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
                  <rect x="4" y="9" width="12" height="9" rx="2" />
                  <path d="M7 9V6a3 3 0 0 1 6 0v3" />
                </svg>
              </span>
            </div>
          </>
        )}
      </div>
      <div className="flex flex-1 flex-col items-center gap-1 p-5 text-center">
        {folder.dateLabel && <p className="text-caption uppercase tracking-wide text-golden-hour/80">{folder.dateLabel}</p>}
        <p className="text-subhead text-[#f4efe9]">{folder.name}</p>
        {folder.open && folder.countLabel && <p className="text-caption text-golden-hour/80">{folder.countLabel}</p>}
        {folder.open ? (
          <span className="mt-3 inline-flex items-center rounded-full bg-highlighter px-6 py-3 text-label font-bold text-on-highlighter transition group-hover:brightness-95">
            Enter this day →
          </span>
        ) : (
          <span className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-label font-bold text-[#f4efe9]/80">
            Locked
          </span>
        )}
      </div>
    </>
  );

  return folder.open ? (
    <Link href={folder.href} className="justified-item focus-brand group flex flex-col shadow-lg shadow-black/30 transition hover:-translate-y-1" style={{ width }}>
      {inner}
    </Link>
  ) : (
    <div className="justified-item flex cursor-not-allowed flex-col shadow-lg shadow-black/30" style={{ width }} aria-label={`${folder.name} (locked)`}>
      {inner}
    </div>
  );
}

export function LockedFolderGrid({ folders }: { folders: LockedFolder[] }) {
  const [ratios, setRatios] = useState<Record<string, number>>({});
  const onRatio = (id: string, ratio: number) => setRatios((prev) => (prev[id] === ratio ? prev : { ...prev, [id]: ratio }));
  const items: JustifyItem[] = folders.map((folder) => ({
    key: folder.id,
    ratio: ratios[folder.id] ?? DEFAULT_RATIO,
    solo: false,
    render: (width, height) => <LockedCard folder={folder} width={width} height={height} onRatio={onRatio} />,
  }));
  return <JustifiedRows items={items} gap={16} fallbackHeight={260} targetHeight={(width) => (width < 640 ? 260 : 360)} />;
}
