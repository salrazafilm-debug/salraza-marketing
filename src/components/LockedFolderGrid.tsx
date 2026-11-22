"use client";

import Link from "next/link";

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

/** Same hero card as the regular vault: one folder per row, full width. A locked folder shows its plain cover and a Locked button. */
function GuestCard({ folder }: { folder: LockedFolder }) {
  const inner = (
    <>
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-black sm:aspect-[16/9] sm:max-h-[78svh]">
        {folder.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={folder.cover}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="h-full w-full bg-[#1d0b11]" />
        )}
      </div>
      <div className="flex flex-1 flex-col items-center gap-1 p-5 text-center sm:p-6">
        {folder.dateLabel && <p className="text-caption uppercase tracking-wide text-golden-hour/80">{folder.dateLabel}</p>}
        <p className="text-subhead text-[#f4efe9]">{folder.name}</p>
        {folder.open && folder.countLabel && <p className="text-caption text-golden-hour/80">{folder.countLabel}</p>}
        {folder.open ? (
          <span className="mt-3 inline-flex items-center rounded-full bg-highlighter px-6 py-3 text-label font-bold text-on-highlighter transition group-hover:brightness-95">
            Enter this day →
          </span>
        ) : (
          <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 text-label font-bold text-[#f4efe9]/85 ring-1 ring-white/25">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <rect x="4" y="9" width="12" height="9" rx="2" />
              <path d="M7 9V6a3 3 0 0 1 6 0v3" />
            </svg>
            Locked
          </span>
        )}
      </div>
    </>
  );

  return folder.open ? (
    <Link href={folder.href} className="focus-brand group flex w-full flex-col shadow-lg shadow-black/30 transition hover:-translate-y-1">
      {inner}
    </Link>
  ) : (
    <div className="flex w-full cursor-not-allowed flex-col shadow-lg shadow-black/30" aria-label={`${folder.name} (locked)`}>
      {inner}
    </div>
  );
}

export function LockedFolderGrid({ folders }: { folders: LockedFolder[] }) {
  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      {folders.map((folder) => (
        <GuestCard key={folder.id} folder={folder} />
      ))}
    </div>
  );
}
