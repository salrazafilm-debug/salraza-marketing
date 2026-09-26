"use client";

import { useEffect, useState } from "react";
import type { MediaItem } from "@/lib/clients";

export type VaultMediaItem = MediaItem & {
  downloadUrl: string;
  posterUrl?: string;
};

/**
 * A real download, not just "open the file": links to a Cloudinary URL with
 * the fl_attachment flag (baked into downloadUrl server-side), which makes
 * Cloudinary's own response include a Content-Disposition: attachment
 * header. That's what makes this reliable on mobile browsers too — a plain
 * <a download> on a cross-origin file like this often just opens it in a
 * new tab instead of saving it.
 */
function DownloadButton({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      download
      aria-label={`Download ${label}`}
      onClick={(event) => event.stopPropagation()}
      className="focus-brand absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-espresso/70 text-golden-hour backdrop-blur transition hover:bg-espresso/90"
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 2.5v9.5M5 8.5l4 4 4-4" />
        <path d="M2.5 14.5v1a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-1" />
      </svg>
    </a>
  );
}

export function VaultMediaGrid({
  items,
  isMarksmen = false,
}: {
  items: VaultMediaItem[];
  isMarksmen?: boolean;
}) {
  const [lightboxItem, setLightboxItem] = useState<VaultMediaItem | null>(null);

  useEffect(() => {
    if (!lightboxItem) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightboxItem(null);
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [lightboxItem]);

  const cardClass = isMarksmen
    ? "relative mb-8 flex flex-col break-inside-avoid overflow-hidden rounded-xl bg-espresso shadow-lg shadow-black/40"
    : "relative flex flex-col overflow-hidden rounded-xl bg-espresso";

  return (
    <>
      <div
        className={
          isMarksmen
            ? "columns-1 gap-8 sm:columns-2"
            : "grid grid-cols-1 items-start gap-6 sm:grid-cols-2 lg:grid-cols-3"
        }
      >
        {items.map((item) =>
          item.type === "video" ? (
            <div key={item.id} className={cardClass}>
              <video
                controls
                autoPlay
                muted
                playsInline
                preload="auto"
                poster={item.posterUrl}
                className="aspect-[4/5] w-full bg-black object-contain"
              >
                <source src={item.src} />
              </video>
              <DownloadButton href={item.downloadUrl} label={item.label} />
              <div className="p-4 text-center sm:p-6">
                <p className="text-subhead text-paper">{item.label}</p>
                {item.caption && <p className="text-caption mt-1 text-golden-hour/80">{item.caption}</p>}
              </div>
            </div>
          ) : (
            <div
              key={item.id}
              className={`${cardClass} group cursor-zoom-in`}
              onClick={() => setLightboxItem(item)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.src}
                alt={item.label}
                className={`block h-auto w-full ${
                  isMarksmen ? "transition-transform duration-500 group-hover:scale-105" : ""
                }`}
              />
              <DownloadButton href={item.downloadUrl} label={item.label} />
              <div className={`p-4 text-center sm:p-6 ${isMarksmen ? "bg-burgundy" : ""}`}>
                <p className="text-subhead text-paper">{item.label}</p>
                {item.caption && <p className="text-caption mt-1 text-golden-hour/80">{item.caption}</p>}
              </div>
            </div>
          )
        )}
      </div>

      {lightboxItem && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 p-4 sm:p-8"
          onClick={() => setLightboxItem(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxItem(null)}
            className="focus-brand absolute right-4 top-4 z-10 flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-label text-white backdrop-blur transition hover:bg-white/20"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M11.5 3 4.5 8l7 5" />
            </svg>
            Back to gallery
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxItem.src}
            alt={lightboxItem.label}
            onClick={(event) => event.stopPropagation()}
            className="max-h-[88vh] max-w-[92vw] rounded-lg object-contain"
          />
        </div>
      )}
    </>
  );
}
