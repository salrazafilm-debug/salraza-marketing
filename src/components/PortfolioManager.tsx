"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PortfolioItem } from "@/lib/portfolio";

export function PortfolioManager({ items }: { items: PortfolioItem[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  // A local copy so moving an item up/down feels instant, reset whenever the
  // server-sourced `items` prop identity changes (add, delete,
  // router.refresh()) — done during render, React's documented pattern for
  // this, rather than an effect, so it can't lag a render behind.
  const [order, setOrder] = useState(items);
  const [syncedItems, setSyncedItems] = useState(items);
  if (items !== syncedItems) {
    setSyncedItems(items);
    setOrder(items);
  }

  async function saveReorder(orderedIds: string[]) {
    await fetch("/api/admin/portfolio/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds }),
    });
    router.refresh();
  }

  function moveByStep(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= order.length) return;
    const next = [...order];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    setOrder(next);
    saveReorder(next.map((item) => item.id));
  }

  async function deleteItem(item: PortfolioItem) {
    if (!confirm(`Remove "${item.title}" from the portfolio?`)) return;
    setBusyId(item.id);
    await fetch(`/api/admin/portfolio/${item.id}`, { method: "DELETE" });
    setBusyId(null);
    router.refresh();
  }

  if (order.length === 0) {
    return <p className="text-body text-ink-muted">Nothing in the portfolio yet — add one above.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {order.map((item, index) => (
        <div key={item.id} className="flex flex-col gap-3 rounded-xl bg-paper-raised p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-caption text-ink-muted">Order: {index + 1}</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => moveByStep(index, -1)}
                disabled={index === 0}
                aria-label="Move earlier"
                className="focus-brand flex h-7 w-7 items-center justify-center rounded-full text-ink-muted hover:bg-line disabled:opacity-30"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9V3M2.5 6.5 6 3l3.5 3.5" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => moveByStep(index, 1)}
                disabled={index === order.length - 1}
                aria-label="Move later"
                className="focus-brand flex h-7 w-7 items-center justify-center rounded-full text-ink-muted hover:bg-line disabled:opacity-30"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 3v6M2.5 5.5 6 9l3.5-3.5" />
                </svg>
              </button>
            </div>
          </div>

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
