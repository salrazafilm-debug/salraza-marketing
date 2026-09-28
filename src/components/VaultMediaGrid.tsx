"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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

/** A small "1/2"-style pill that cycles through a photo's variants on click. */
function VariantToggle({
  index,
  total,
  onToggle,
}: {
  index: number;
  total: number;
  onToggle: () => void;
}) {
  if (total <= 1) return null;
  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onToggle();
      }}
      aria-label={`Show variant ${((index + 1) % total) + 1} of ${total}`}
      className="focus-brand absolute bottom-3 left-3 z-10 rounded-full bg-espresso/70 px-2.5 py-1 text-caption font-bold text-golden-hour backdrop-blur transition hover:bg-espresso/90"
    >
      {index + 1}/{total}
    </button>
  );
}

function ImageTile({
  item,
  cardClass,
  mediaHeightClass,
  isMarksmen,
  onOpen,
}: {
  item: VaultMediaItem;
  cardClass: string;
  mediaHeightClass: string;
  isMarksmen: boolean;
  onOpen: (index: number) => void;
}) {
  const [index, setIndex] = useState(0);
  const images = [item.src, ...item.variants];
  const activeSrc = images[index] ?? item.src;

  return (
    <div className={`${cardClass} cursor-zoom-in`} onClick={() => onOpen(index)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={activeSrc}
        alt={item.label}
        className={
          isMarksmen
            ? `${mediaHeightClass} w-auto object-cover transition-transform duration-500 group-hover:scale-105`
            : "block h-auto w-full"
        }
      />
      <DownloadButton href={item.downloadUrl} label={item.label} />
      <VariantToggle
        index={index}
        total={images.length}
        onToggle={() => setIndex((current) => (current + 1) % images.length)}
      />
      <div className={`p-4 text-center sm:p-6 ${isMarksmen ? "bg-burgundy" : ""}`}>
        <p className="text-subhead text-paper">{item.label}</p>
        {item.caption && <p className="text-caption mt-1 text-golden-hour/80">{item.caption}</p>}
      </div>
    </div>
  );
}

export function VaultMediaGrid({
  items,
  isMarksmen = false,
}: {
  items: VaultMediaItem[];
  isMarksmen?: boolean;
}) {
  const [lightbox, setLightbox] = useState<{ item: VaultMediaItem; index: number } | null>(null);

  useEffect(() => {
    if (!lightbox) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightbox(null);
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [lightbox]);

  // Marksmen: an equal-height "shelf" (flex-wrap, each media element the
  // same height, natural width) instead of a fixed grid or column-based
  // masonry — it packs every row using the full row width regardless of
  // how tall or wide each photo/video naturally is, so there's no leftover
  // gap the way a strict column layout leaves when heights don't balance,
  // and it keeps working the same way as more photos get added later.
  const cardClass = isMarksmen
    ? "group relative flex shrink-0 flex-col overflow-hidden rounded-xl bg-espresso shadow-lg shadow-black/40"
    : "relative flex flex-col overflow-hidden rounded-xl bg-espresso";
  const mediaHeightClass = "h-64 sm:h-80 lg:h-[26rem]";

  const lightboxImages = lightbox ? [lightbox.item.src, ...lightbox.item.variants] : [];

  return (
    <>
      <div
        className={
          isMarksmen
            ? "flex flex-wrap items-start justify-center gap-6"
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
                className={
                  isMarksmen
                    ? `${mediaHeightClass} w-auto bg-black object-contain`
                    : "aspect-[4/5] w-full bg-black object-contain"
                }
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
            <ImageTile
              key={item.id}
              item={item}
              cardClass={cardClass}
              mediaHeightClass={mediaHeightClass}
              isMarksmen={isMarksmen}
              onOpen={(index) => setLightbox({ item, index })}
            />
          )
        )}
      </div>

      {lightbox &&
        createPortal(
          // Rendered straight onto document.body, not in normal flow here:
          // this grid sits inside a RevealSection, whose fade/slide-in
          // relies on a CSS transform — and a transform on any ancestor
          // turns `position: fixed` into "fixed to that ancestor" instead
          // of the real viewport, which is what was pinning this off
          // center and clipping it. A portal escapes that entirely.
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 p-4 sm:p-8"
            onClick={() => setLightbox(null)}
          >
            <button
              type="button"
              onClick={() => setLightbox(null)}
              className="focus-brand absolute right-4 top-4 z-10 flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-label text-white backdrop-blur transition hover:bg-white/20"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M11.5 3 4.5 8l7 5" />
              </svg>
              Back to gallery
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxImages[lightbox.index] ?? lightbox.item.src}
              alt={lightbox.item.label}
              onClick={(event) => event.stopPropagation()}
              className="max-h-[88svh] max-w-[92vw] rounded-lg object-contain"
            />
            {lightboxImages.length > 1 && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setLightbox((current) =>
                    current ? { ...current, index: (current.index + 1) % lightboxImages.length } : current
                  );
                }}
                className="focus-brand absolute bottom-6 z-10 rounded-full bg-white/10 px-4 py-2 text-label font-bold text-white backdrop-blur transition hover:bg-white/20"
              >
                {lightbox.index + 1}/{lightboxImages.length}
              </button>
            )}
          </div>,
          document.body
        )}
    </>
  );
}
