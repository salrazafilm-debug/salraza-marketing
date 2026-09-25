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
    <div className="flex flex-wrap gap-2 sm:gap-6">
      {items.map((item, index) => (
        <figure
          key={item.title}
          className="group relative h-44 shrink-0 overflow-hidden rounded-lg transition-transform duration-300 hover:-translate-y-1 sm:h-64 sm:rounded-xl lg:h-80"
          onMouseEnter={() => revealCaption(index)}
          onTouchStart={() => revealCaption(index)}
        >
          <Image
            src={item.image}
            alt={item.title}
            width={item.width}
            height={item.height}
            sizes="(min-width: 1024px) 480px, (min-width: 640px) 360px, 220px"
            className="block h-full w-auto"
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
