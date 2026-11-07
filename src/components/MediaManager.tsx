"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { MediaItem, MediaVariant } from "@/lib/clients";
import { compressImageIfNeeded, uploadToCloudinary } from "@/lib/upload-client";


function GripIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <circle cx="4" cy="3" r="1.3" />
      <circle cx="10" cy="3" r="1.3" />
      <circle cx="4" cy="7" r="1.3" />
      <circle cx="10" cy="7" r="1.3" />
      <circle cx="4" cy="11" r="1.3" />
      <circle cx="10" cy="11" r="1.3" />
    </svg>
  );
}

function VariantsSection({
  clientSlug,
  mediaItemId,
  variants,
}: {
  clientSlug: string;
  mediaItemId: string;
  variants: MediaVariant[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [busyVariantId, setBusyVariantId] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>();

  async function handleAddVariant(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(undefined);
    setUploading(true);

    try {
      const uploadFile = await compressImageIfNeeded(file);
      const uploadResult = await uploadToCloudinary(uploadFile, `clients/${clientSlug}`);

      const saveRes = await fetch(`/api/admin/media/${mediaItemId}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: uploadResult.secure_url,
          cloudinaryPublicId: uploadResult.public_id,
        }),
      });
      const saveData = await saveRes.json();
      if (!saveRes.ok) throw new Error(saveData.error || "Could not save the variant.");

      if (fileInputRef.current) fileInputRef.current.value = "";
      router.refresh();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteVariant(variant: MediaVariant) {
    if (!confirm("Remove this variant?")) return;
    setBusyVariantId(variant.id);
    await fetch(`/api/admin/media-variants/${variant.id}`, { method: "DELETE" });
    setBusyVariantId(null);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2 border-t border-line pt-2">
      <p className="text-caption font-bold text-ink-muted">
        Variants {variants.length > 0 && `(${variants.length + 1} total)`}
      </p>

      {variants.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {variants.map((variant) => (
            <div key={variant.id} className="relative h-14 w-14 overflow-hidden rounded-lg bg-espresso">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={variant.image} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => handleDeleteVariant(variant)}
                disabled={busyVariantId === variant.id}
                aria-label="Remove variant"
                className="focus-brand absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink/80 text-paper disabled:opacity-60"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <label className="focus-brand inline-flex w-fit cursor-pointer items-center text-caption text-purple-text underline">
        {uploading ? "Uploading…" : "+ Add a variant"}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleAddVariant}
          disabled={uploading}
          className="hidden"
        />
      </label>

      {error && <p className="text-caption text-red-700">{error}</p>}
    </div>
  );
}

function ItemGrid({
  clientSlug,
  items,
  busyId,
  drafts,
  variantsByItem,
  onDraftChange,
  onSave,
  onDelete,
  onReorder,
  coverId,
  onSetCover,
}: {
  clientSlug: string;
  items: MediaItem[];
  busyId: string | null;
  /** Folder grids only: the item currently used as the folder thumbnail. */
  coverId?: string | null;
  onSetCover?: (item: MediaItem) => void;
  drafts: Record<string, { label: string; caption: string }>;
  variantsByItem: Record<string, MediaVariant[]>;
  onDraftChange: (id: string, draft: { label: string; caption: string }) => void;
  onSave: (item: MediaItem) => void;
  onDelete: (item: MediaItem) => void;
  onReorder: (orderedIds: string[]) => void;
}) {
  // A local copy so dragging/moving feels instant, reset whenever the
  // server-sourced `items` prop identity changes (new upload, delete,
  // router.refresh()) — done during render, React's documented pattern for
  // this, rather than an effect, so it can't lag a render behind.
  const [order, setOrder] = useState(items);
  const [syncedItems, setSyncedItems] = useState(items);
  if (items !== syncedItems) {
    setSyncedItems(items);
    setOrder(items);
  }
  const [dragId, setDragId] = useState<string | null>(null);

  if (order.length === 0) {
    return <p className="text-caption text-ink-muted">Nothing uploaded here yet.</p>;
  }

  function moveTo(fromId: string, toId: string) {
    if (fromId === toId) return;
    const next = [...order];
    const fromIndex = next.findIndex((item) => item.id === fromId);
    const toIndex = next.findIndex((item) => item.id === toId);
    if (fromIndex === -1 || toIndex === -1) return;
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setOrder(next);
    onReorder(next.map((item) => item.id));
  }

  function moveByStep(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= order.length) return;
    const next = [...order];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    setOrder(next);
    onReorder(next.map((item) => item.id));
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {order.map((item, index) => {
        const draft = drafts[item.id] ?? { label: item.label, caption: item.caption ?? "" };
        return (
          <div
            key={item.id}
            draggable
            onDragStart={() => setDragId(item.id)}
            onDragEnd={() => setDragId(null)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => dragId && moveTo(dragId, item.id)}
            className={`flex flex-col gap-3 rounded-xl bg-paper-raised p-4 transition-opacity ${
              dragId === item.id ? "opacity-40" : ""
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="flex cursor-grab items-center gap-1 text-ink-muted active:cursor-grabbing">
                <GripIcon />
                <span className="text-caption">Drag to reorder</span>
              </span>
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

            <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-espresso">
              {coverId === item.id && (
                <span className="absolute left-2 top-2 z-10 rounded-full bg-highlighter px-3 py-1 text-caption font-bold text-on-highlighter">
                  Folder cover
                </span>
              )}
              {item.externalUrl && (
                <span className="absolute bottom-2 right-2 z-10 rounded-full bg-ink/80 px-3 py-1 text-caption text-paper">
                  Video link
                </span>
              )}
              {item.type === "video" && !item.externalUrl ? (
                <video src={item.src} className="h-full w-full object-cover" muted />
              ) : item.externalUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.thumbnailUrl ?? ""} alt={item.label} className="h-full w-full object-cover" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.src} alt={item.label} className="h-full w-full object-cover" />
              )}
            </div>

            <input
              value={draft.label}
              onChange={(event) => onDraftChange(item.id, { ...draft, label: event.target.value })}
              className="focus-brand rounded border border-line bg-paper px-3 py-2 text-label text-ink"
            />
            <input
              value={draft.caption}
              onChange={(event) => onDraftChange(item.id, { ...draft, caption: event.target.value })}
              placeholder="Caption"
              className="focus-brand rounded border border-line bg-paper px-3 py-2 text-caption text-ink"
            />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => onSave(item)}
                disabled={busyId === item.id}
                className="focus-brand text-label text-purple-text underline disabled:opacity-60"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => onDelete(item)}
                disabled={busyId === item.id}
                className="focus-brand text-label text-red-700 underline disabled:opacity-60"
              >
                Delete
              </button>
              {onSetCover && coverId !== item.id && (item.type === "image" || item.externalUrl) && (
                <button
                  type="button"
                  onClick={() => onSetCover(item)}
                  className="focus-brand text-label text-ink underline"
                >
                  Use as folder cover
                </button>
              )}
            </div>

            {item.type === "image" && (
              <VariantsSection
                clientSlug={clientSlug}
                mediaItemId={item.id}
                variants={variantsByItem[item.id] ?? []}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * The editable grid for one folder (or for individual uploads): rename,
 * caption, reorder, delete, variants, and "Use as folder cover".
 */
export function FolderItems({
  clientSlug,
  items,
  variantsByItem,
  coverId,
  onSetCover,
}: {
  clientSlug: string;
  items: MediaItem[];
  variantsByItem: Record<string, MediaVariant[]>;
  coverId?: string | null;
  onSetCover?: (item: MediaItem) => void;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { label: string; caption: string }>>({});

  async function saveEdit(item: MediaItem) {
    const draft = drafts[item.id] ?? { label: item.label, caption: item.caption ?? "" };
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

  async function saveReorder(orderedIds: string[]) {
    await fetch("/api/admin/media/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds }),
    });
    router.refresh();
  }

  return (
    <ItemGrid
      clientSlug={clientSlug}
      items={items}
      busyId={busyId}
      drafts={drafts}
      variantsByItem={variantsByItem}
      onDraftChange={(id, draft) => setDrafts((prev) => ({ ...prev, [id]: draft }))}
      onSave={saveEdit}
      onDelete={deleteItem}
      onReorder={saveReorder}
      coverId={coverId}
      onSetCover={onSetCover}
    />
  );
}
