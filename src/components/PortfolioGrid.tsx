import { listPortfolioItems } from "@/lib/portfolio";
import { PortfolioTile } from "@/components/PortfolioTile";

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
        <PortfolioTile
          key={item.id}
          images={item.images}
          alt={item.title}
          size={size}
          sizes={
            size === "large"
              ? "(min-width: 1024px) 33vw, 50vw"
              : "(min-width: 640px) 33vw, 33vw"
          }
        />
      ))}
    </div>
  );
}
