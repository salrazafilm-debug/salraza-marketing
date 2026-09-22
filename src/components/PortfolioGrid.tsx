import Image from "next/image";
import { PORTFOLIO_ITEMS } from "@/lib/portfolio";

export function PortfolioGrid({ limit }: { limit?: number }) {
  const items = limit ? PORTFOLIO_ITEMS.slice(0, limit) : PORTFOLIO_ITEMS;

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-6">
      {items.map((item) => (
        <div
          key={item.title}
          className="group relative flex aspect-square flex-col justify-end overflow-hidden rounded-lg transition-transform duration-300 hover:-translate-y-1 sm:aspect-[4/5] sm:rounded-xl"
        >
          <Image
            src={item.image}
            alt={item.title}
            fill
            sizes="(min-width: 640px) 33vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-espresso/90 via-espresso/10 to-transparent" />
          <div className="relative p-1.5 sm:p-6">
            <span className="hidden text-caption uppercase tracking-wide text-golden-hour/80 sm:block">
              {item.category}
            </span>
            <p className="text-[9px] font-bold leading-tight text-paper sm:mt-1 sm:text-subhead">
              {item.title}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
