"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PortfolioItem } from "@/lib/portfolio";

export function PortfolioManager({ items }: { items: PortfolioItem[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function deleteItem(item: PortfolioItem) {
    if (!confirm(`Remove "${item.title}" from the portfolio?`)) return;
    setBusyId(item.id);
    await fetch(`/api/admin/portfolio/${item.id}`, { method: "DELETE" });
    setBusyId(null);
    router.refresh();
  }

  if (items.length === 0) {
    return <p className="text-body text-ink-muted">Nothing in the portfolio yet — add one above.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div key={item.id} className="flex flex-col gap-3 rounded-xl bg-paper-raised p-4">
          <div className="flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-espresso">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
          </div>
          <div>
            <p className="text-label text-ink">{item.title}</p>
            <p className="text-caption text-warm-text">{item.category}</p>
          </div>
          <button
            type="button"
            onClick={() => deleteItem(item)}
            disabled={busyId === item.id}
            className="focus-brand w-fit text-label text-red-700 underline disabled:opacity-60"
          >
            {busyId === item.id ? "Removing…" : "Remove"}
          </button>
        </div>
      ))}
    </div>
  );
}
