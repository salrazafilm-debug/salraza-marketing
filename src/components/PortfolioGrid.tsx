"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { PORTFOLIO_ITEMS } from "@/lib/portfolio";

const CAPTION_VISIBLE_MS = 3000;

export function PortfolioGrid({ limit }: { limit?: number }) {
  const items = limit ? PORTFOLIO_ITEMS.slice(0, limit) : PORTFOLIO_ITEMS;
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  function revealCaption(index: number) {
    setActiveIndex(index);
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    hideTimeout.current = setTimeout(() => setActiveIndex(null), CAPTION_VISIBLE_MS);
  }

  return (
    <div className="grid grid-cols-2 items-start gap-2 sm:grid-cols-3 sm:gap-6">
      {items.map((item, index) => (
        <figure
          key={item.title}
          className="group relative overflow-hidden rounded-lg transition-transform duration-300 hover:-translate-y-1 sm:rounded-xl"
          onMouseEnter={() => revealCaption(index)}
          onTouchStart={() => revealCaption(index)}
        >
          <Image
            src={item.image}
            alt={item.title}
            width={item.width}
            height={item.height}
            sizes="(min-width: 640px) 33vw, 50vw"
            className="block h-auto w-full"
          />
          <figcaption
            className={`pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-espresso/85 to-transparent px-3 py-4 text-label text-paper transition-opacity duration-500 ${
              activeIndex === index ? "opacity-100" : "opacity-0"
            }`}
          >
            {item.title}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
