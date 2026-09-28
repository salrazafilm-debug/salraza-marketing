import Image from "next/image";
import { listPortfolioItems } from "@/lib/portfolio";

export async function PortfolioGrid({
  limit,
  size = "compact",
}: {
  limit?: number;
  /** "compact" (default): the tight 3-column teaser used on the homepage.
   * "large": fewer, bigger columns with more breathing room, for the
   * dedicated /portfolio page. */
  size?: "compact" | "large";
}) {
  const allItems = await listPortfolioItems();
  const items = limit ? allItems.slice(0, limit) : allItems;

  return (
    <div
      className={
        size === "large"
          ? "grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-10"
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
            sizes={size === "large" ? "(min-width: 640px) 50vw, 100vw" : "(min-width: 640px) 33vw, 33vw"}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      ))}
    </div>
  );
}
