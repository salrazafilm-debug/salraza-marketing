"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { MediaItem } from "@/lib/clients";

export function MediaManager({ items }: { items: MediaItem[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { label: string; caption: string }>>({});

  function draftFor(item: MediaItem) {
    return drafts[item.id] ?? { label: item.label, caption: item.caption ?? "" };
  }

  async function saveEdit(item: MediaItem) {
    const draft = draftFor(item);
    setBusyId(item.id);
    await fetch(`/api/admin/media/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: draft.label, caption: draft.caption }),
    });
    setBusyId(null);
    router.refresh();
  }

  async function deleteItem(item: MediaItem) {
    if (!confirm(`Delete "${item.label}"? This removes it from Cloudinary too.`)) return;
    setBusyId(item.id);
    await fetch(`/api/admin/media/${item.id}`, { method: "DELETE" });
    setBusyId(null);
    router.refresh();
  }

  if (items.length === 0) {
    return <p className="text-body text-ink-muted">Nothing uploaded yet.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const draft = draftFor(item);
        return (
          <div key={item.id} className="flex flex-col gap-3 rounded-xl bg-paper-raised p-4">
            <div className="flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-espresso">
              {item.type === "video" ? (
                <video src={item.src} className="h-full w-full object-cover" muted />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.src} alt={item.label} className="h-full w-full object-cover" />
              )}
            </div>

            <input
              value={draft.label}
              onChange={(event) =>
                setDrafts((prev) => ({ ...prev, [item.id]: { ...draft, label: event.target.value } }))
              }
              className="focus-brand rounded border border-line bg-paper px-3 py-2 text-label text-ink"
            />
            <input
              value={draft.caption}
              onChange={(event) =>
                setDrafts((prev) => ({ ...prev, [item.id]: { ...draft, caption: event.target.value } }))
              }
              placeholder="Caption"
              className="focus-brand rounded border border-line bg-paper px-3 py-2 text-caption text-ink"
            />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => saveEdit(item)}
                disabled={busyId === item.id}
                className="focus-brand text-label text-purple-text underline disabled:opacity-60"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => deleteItem(item)}
                disabled={busyId === item.id}
                className="focus-brand text-label text-red-700 underline disabled:opacity-60"
              >
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
