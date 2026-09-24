"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Folder, MediaItem } from "@/lib/clients";

function ItemGrid({
  items,
  busyId,
  drafts,
  onDraftChange,
  onSave,
  onDelete,
}: {
  items: MediaItem[];
  busyId: string | null;
  drafts: Record<string, { label: string; caption: string }>;
  onDraftChange: (id: string, draft: { label: string; caption: string }) => void;
  onSave: (item: MediaItem) => void;
  onDelete: (item: MediaItem) => void;
}) {
  if (items.length === 0) {
    return <p className="text-caption text-ink-muted">Nothing uploaded here yet.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const draft = drafts[item.id] ?? { label: item.label, caption: item.caption ?? "" };
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
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function MediaManager({ items, folders }: { items: MediaItem[]; folders: Folder[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [busyFolderId, setBusyFolderId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { label: string; caption: string }>>({});

  function handleDraftChange(id: string, draft: { label: string; caption: string }) {
    setDrafts((prev) => ({ ...prev, [id]: draft }));
  }

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

  async function deleteFolder(folder: Folder, itemCount: number) {
    const warning =
      itemCount > 0
        ? `Delete "${folder.name}" and all ${itemCount} item${itemCount === 1 ? "" : "s"} inside it? This removes them from Cloudinary too.`
        : `Delete the empty folder "${folder.name}"?`;
    if (!confirm(warning)) return;
    setBusyFolderId(folder.id);
    await fetch(`/api/admin/folders/${folder.id}`, { method: "DELETE" });
    setBusyFolderId(null);
    router.refresh();
  }

  const ungrouped = items.filter((item) => !item.folderId);

  if (items.length === 0 && folders.length === 0) {
    return <p className="text-body text-ink-muted">Nothing uploaded yet.</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      {folders.map((folder) => {
        const folderItems = items.filter((item) => item.folderId === folder.id);
        return (
          <div key={folder.id} className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <p className="text-subhead text-ink">
                {folder.name}{" "}
                <span className="text-caption font-normal text-ink-muted">
                  ({folderItems.length})
                </span>
              </p>
              <button
                type="button"
                onClick={() => deleteFolder(folder, folderItems.length)}
                disabled={busyFolderId === folder.id}
                className="focus-brand text-label text-red-700 underline disabled:opacity-60"
              >
                Delete folder
              </button>
            </div>
            <ItemGrid
              items={folderItems}
              busyId={busyId}
              drafts={drafts}
              onDraftChange={handleDraftChange}
              onSave={saveEdit}
              onDelete={deleteItem}
            />
          </div>
        );
      })}

      {(folders.length === 0 || ungrouped.length > 0) && (
        <div className="flex flex-col gap-4">
          {folders.length > 0 && (
            <p className="text-subhead border-b border-line pb-2 text-ink">Individual uploads</p>
          )}
          <ItemGrid
            items={ungrouped}
            busyId={busyId}
            drafts={drafts}
            onDraftChange={handleDraftChange}
            onSave={saveEdit}
            onDelete={deleteItem}
          />
        </div>
      )}
    </div>
  );
}
