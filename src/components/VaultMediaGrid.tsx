"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { MediaItem } from "@/lib/clients";
import { DEFAULT_RATIO, JustifiedRows, clampRatio, type JustifyItem } from "@/components/JustifiedRows";

export type VaultMediaItem = MediaItem & {
  downloadUrl: string;
  posterUrl?: string;
};

/**
 * A real download, not just "open the file": links to a Cloudinary URL with
 * the fl_attachment flag (baked into downloadUrl server-side), which makes
 * Cloudinary's own response include a Content-Disposition: attachment
 * header. That's what makes this reliable on mobile browsers too.
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

/** A small pill that cycles through a photo's variants on click. */
function VariantToggle({ index, total, onToggle }: { index: number; total: number; onToggle: () => void }) {
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
      className="focus-brand absolute bottom-3 left-3 z-10 flex items-center gap-2 rounded-full bg-espresso/80 px-3.5 py-2 text-label font-bold text-golden-hour shadow-lg backdrop-blur transition hover:scale-105 hover:bg-espresso/95 active:scale-95"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M2 8a6 6 0 0 1 10.2-4.2" />
        <path d="M12.5 1.5v2.8h-2.8" />
        <path d="M14 8a6 6 0 0 1-10.2 4.2" />
        <path d="M3.5 14.5v-2.8h2.8" />
      </svg>
      Click here · {index + 1}/{total}
    </button>
  );
}

/** Caption shown over the bottom of a tile — only when the admin typed one. */
function Caption({ text, isMarksmen }: { text: string | null; isMarksmen: boolean }) {
  if (!text) return null;
  return (
    <div
      className={`absolute inset-x-0 bottom-0 bg-gradient-to-t to-transparent px-4 pb-4 pt-12 text-center ${
        isMarksmen ? "from-burgundy/95" : "from-espresso/90"
      }`}
    >
      <p className="text-caption text-golden-hour/90">{text}</p>
    </div>
  );
}

type TileProps = {
  item: VaultMediaItem;
  width: number;
  height: number;
  isMarksmen: boolean;
  onRatio: (id: string, ratio: number) => void;
};

function ImageTile({ item, width, height, isMarksmen, onRatio, onOpen }: TileProps & { onOpen: (index: number) => void }) {
  const [index, setIndex] = useState(0);
  const images = [item.src, ...item.variants];
  const activeSrc = images[index] ?? item.src;

  return (
    <div
      className={`justified-item group cursor-zoom-in ${isMarksmen ? "shadow-lg shadow-black/40" : ""}`}
      style={{ width, height }}
      onClick={() => onOpen(index)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={activeSrc}
        alt={item.label}
        onLoad={(event) =>
          onRatio(item.id, clampRatio(event.currentTarget.naturalWidth, event.currentTarget.naturalHeight))
        }
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <DownloadButton href={item.downloadUrl} label={item.label} />
      <VariantToggle index={index} total={images.length} onToggle={() => setIndex((current) => (current + 1) % images.length)} />
      <Caption text={item.caption} isMarksmen={isMarksmen} />
    </div>
  );
}

function VideoTile({ item, width, height, isMarksmen, onRatio }: TileProps) {
  return (
    <div className={`justified-item ${isMarksmen ? "shadow-lg shadow-black/40" : ""}`} style={{ width, height }}>
      <video
        controls
        autoPlay
        muted
        playsInline
        preload="auto"
        poster={item.posterUrl}
        onLoadedMetadata={(event) =>
          onRatio(item.id, clampRatio(event.currentTarget.videoWidth, event.currentTarget.videoHeight))
        }
        className="absolute inset-0 h-full w-full bg-black object-contain"
      >
        <source src={item.src} />
      </video>
      <DownloadButton href={item.downloadUrl} label={item.label} />
      <Caption text={item.caption} isMarksmen={isMarksmen} />
    </div>
  );
}

/** A video hosted on a cloud drive: its own thumbnail, opens the link in a new tab. */
function LinkVideoTile({ item, width, height, isMarksmen, onRatio }: TileProps) {
  return (
    <a
      href={item.externalUrl ?? "#"}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Watch ${item.label} (opens in a new tab)`}
      className={`justified-item group focus-brand ${isMarksmen ? "shadow-lg shadow-black/40" : ""}`}
      style={{ width, height }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.thumbnailUrl ?? ""}
        alt={item.label}
        onLoad={(event) =>
          onRatio(item.id, clampRatio(event.currentTarget.naturalWidth, event.currentTarget.naturalHeight))
        }
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-espresso/75 text-golden-hour backdrop-blur">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
      <span className="absolute left-3 top-3 z-10 rounded-full bg-espresso/80 px-3.5 py-2 text-label font-bold text-golden-hour shadow-lg backdrop-blur">
        Watch video ↗
      </span>
      <Caption text={item.caption} isMarksmen={isMarksmen} />
    </a>
  );
}

/**
 * Photos and videos laid out in rows that fill the full width with no gaps.
 * Each tile is sized from its real shape (measured as it loads), so images
 * are never cropped and every row lines up automatically as media is added.
 * `fullWidth` gives a single item its own full-width row (used for a
 * folder's premium cover video).
 */
export function VaultMediaGrid({
  items,
  isMarksmen = false,
  fullWidth = false,
}: {
  items: VaultMediaItem[];
  isMarksmen?: boolean;
  fullWidth?: boolean;
}) {
  const [lightbox, setLightbox] = useState<{ item: VaultMediaItem; index: number } | null>(null);
  const [ratios, setRatios] = useState<Record<string, number>>({});

  function reportRatio(id: string, ratio: number) {
    setRatios((prev) => (prev[id] === ratio ? prev : { ...prev, [id]: ratio }));
  }

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

  const lightboxImages = lightbox ? [lightbox.item.src, ...lightbox.item.variants] : [];

  const layoutItems: JustifyItem[] = items.map((item) => ({
    key: item.id,
    ratio: ratios[item.id] ?? DEFAULT_RATIO,
    solo: fullWidth,
    render: (width, height) => {
      const tile = { item, width, height, isMarksmen, onRatio: reportRatio };
      if (item.externalUrl) return <LinkVideoTile {...tile} />;
      if (item.type === "video") return <VideoTile {...tile} />;
      return <ImageTile {...tile} onOpen={(index) => setLightbox({ item, index })} />;
    },
  }));

  return (
    <>
      <JustifiedRows
        items={layoutItems}
        gap={12}
        targetHeight={(width) => (width < 640 ? 200 : width < 1024 ? 250 : 300) + (isMarksmen ? 30 : 0)}
      />

      {lightbox &&
        createPortal(
          // Rendered on document.body so the reveal animation's transform can't
          // pull this fixed overlay out of the viewport.
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
                className="focus-brand absolute bottom-6 z-10 flex items-center gap-2 rounded-full bg-white/15 px-5 py-2.5 text-body font-bold text-white shadow-lg backdrop-blur transition hover:scale-105 hover:bg-white/25 active:scale-95"
              >
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M2 8a6 6 0 0 1 10.2-4.2" />
                  <path d="M12.5 1.5v2.8h-2.8" />
                  <path d="M14 8a6 6 0 0 1-10.2 4.2" />
                  <path d="M3.5 14.5v-2.8h2.8" />
                </svg>
                Click here · {lightbox.index + 1}/{lightboxImages.length}
              </button>
            )}
          </div>,
          document.body
        )}
    </>
  );
}
