"use client";

import { useState } from "react";
import Image from "next/image";

/**
 * One portfolio grid tile. When a photo has extra variants, a small "1/2"
 * box sits on the image and cycles through them on click — otherwise it's
 * just the plain photo.
 */
export function PortfolioTile({
  images,
  alt,
  size,
  sizes,
}: {
  images: string[];
  alt: string;
  size: "compact" | "large";
  sizes: string;
}) {
  const [index, setIndex] = useState(0);
  const hasVariants = images.length > 1;

  return (
    <div
      className={`group relative aspect-square overflow-hidden transition-transform duration-300 hover:-translate-y-1 ${
        size === "large" ? "rounded-xl sm:aspect-[4/5] sm:rounded-2xl" : "rounded-lg sm:aspect-[4/5] sm:rounded-xl"
      }`}
    >
      <Image
        src={images[index]}
        alt={alt}
        fill
        sizes={sizes}
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />

      {hasVariants && (
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setIndex((current) => (current + 1) % images.length);
          }}
          aria-label={`Show variant ${((index + 1) % images.length) + 1} of ${images.length}`}
          className="focus-brand absolute bottom-2 right-2 z-10 rounded-full bg-ink/70 px-2.5 py-1 text-caption font-bold text-paper backdrop-blur transition hover:bg-ink"
        >
          {index + 1}/{images.length}
        </button>
      )}
    </div>
  );
}
