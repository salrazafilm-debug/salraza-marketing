import Image from "next/image";
import { listPortfolioItems } from "@/lib/portfolio";

export async function PortfolioGrid({
  limit,
  size = "compact",
}: {
  limit?: number;
  /** "compact" (default): the tight 3-column teaser used on the homepage.
   * "large": 2 columns on mobile, 3 on larger screens, with wider gaps for
   * more breathing room — used on the dedicated /portfolio page. */
  size?: "compact" | "large";
}) {
  const allItems = await listPortfolioItems();
  const items = limit ? allItems.slice(0, limit) : allItems;

  return (
    <div
      className={
        size === "large"
          ? "grid grid-cols-2 gap-4 sm:gap-8 lg:grid-cols-3"
          : "grid grid-cols-3 gap-2 sm:gap-6"
      }
    >
      {items.map((item) => (
        <div
          key={item.id}
          className={`group relative aspect-square overflow-hidden transition-transform duration-300 hover:-translate-y-1 ${
            size === "large" ? "rounded-xl sm:aspect-[4/5] sm:rounded-2xl" : "rounded-lg sm:aspect-[4/5] sm:rounded-xl"
          }`}
        >
          <Image
            src={item.image}
            alt={item.title}
            fill
            sizes={
              size === "large"
                ? "(min-width: 1024px) 33vw, 50vw"
                : "(min-width: 640px) 33vw, 33vw"
            }
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      ))}
    </div>
  );
}
