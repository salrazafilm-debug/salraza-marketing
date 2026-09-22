import Image from "next/image";
import { PORTFOLIO_ITEMS } from "@/lib/portfolio";

export function PortfolioGrid({ limit }: { limit?: number }) {
  const items = limit ? PORTFOLIO_ITEMS.slice(0, limit) : PORTFOLIO_ITEMS;

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.title}
          className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-xl transition-transform duration-300 hover:-translate-y-1"
        >
          <Image
            src={item.image}
            alt={item.title}
            fill
            sizes="(min-width: 640px) 33vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-espresso/90 via-espresso/10 to-transparent" />
          <div className="relative p-6">
            <span className="text-caption uppercase tracking-wide text-golden-hour/80">
              {item.category}
            </span>
            <p className="text-subhead mt-1 text-paper">{item.title}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
