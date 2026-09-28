import Image from "next/image";
import { listPortfolioItems } from "@/lib/portfolio";

/**
 * The full /portfolio page's gallery: one large photo at a time instead of a
 * grid, so each piece of work gets its own space. `snap-y snap-proximity` +
 * `snap-center` on each item gives scrolling a gentle "settle on the next
 * one" feel on both mobile and desktop, without hard-locking the scroll the
 * way `snap-mandatory` would on a trackpad or mouse wheel.
 */
export async function PortfolioFeed() {
  const items = await listPortfolioItems();

  return (
    <div className="snap-y snap-proximity flex flex-col items-center gap-16 sm:gap-24">
      {items.map((item) => (
        <figure key={item.id} className="w-full max-w-4xl snap-center">
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl sm:aspect-[16/10]">
            <Image
              src={item.image}
              alt={item.title}
              fill
              sizes="(min-width: 896px) 896px, 100vw"
              className="object-cover"
            />
          </div>
          <figcaption className="mt-4 flex items-center justify-between px-1">
            <p className="text-subhead text-ink">{item.title}</p>
            <span className="text-caption uppercase tracking-wide text-warm-text">
              {item.category}
            </span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
