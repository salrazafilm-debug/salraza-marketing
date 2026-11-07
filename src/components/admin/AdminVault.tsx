"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Folder, MediaItem, MediaVariant } from "@/lib/clients";
import { FolderItems } from "@/components/MediaManager";
import { compressImageIfNeeded, uploadToCloudinary } from "@/lib/upload-client";
import { AddMediaPanel } from "@/components/admin/AddMediaPanel";

export const INDIVIDUAL = "individual";

function thumbOf(item: MediaItem): string | null {
  if (item.externalUrl) return item.thumbnailUrl;
  return item.type === "image" ? item.src : null;
}

function folderCover(folder: Folder, items: MediaItem[]): string | null {
  if (folder.coverUrl) return folder.coverUrl;
  const chosen = items.find((item) => item.id === folder.coverMediaId);
  if (chosen && thumbOf(chosen)) return thumbOf(chosen);
  return items.map(thumbOf).find(Boolean) ?? null;
}

function formatDate(date: string | null): string | null {
  if (!date) return null;
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function counts(items: MediaItem[]): string {
  const photos = items.filter((item) => item.type === "image").length;
  const videos = items.length - photos;
  if (items.length === 0) return "Empty";
  return [photos && `${photos} photo${photos === 1 ? "" : "s"}`, videos && `${videos} video${videos === 1 ? "" : "s"}`]
    .filter(Boolean)
    .join(" · ");
}

async function patchFolder(id: string, body: Record<string, unknown>) {
  const res = await fetch(`/api/admin/folders/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Could not save.");
  }
}

export function AdminVault({
  clientSlug,
  folders,
  items,
  variantsByItem,
  selected,
}: {
  clientSlug: string;
  folders: Folder[];
  items: MediaItem[];
  variantsByItem: Record<string, MediaVariant[]>;
  /** A folder id, INDIVIDUAL, or null for the folder overview. */
  selected: string | null;
}) {
  const folder = folders.find((f) => f.id === selected);
  if (folder) {
    return (
      <FolderWorkspace
        clientSlug={clientSlug}
        folder={folder}
        items={items.filter((item) => item.folderId === folder.id)}
        variantsByItem={variantsByItem}
      />
    );
  }
  if (selected === INDIVIDUAL) {
    return (
      <div className="flex flex-col gap-6">
        <WorkspaceHeader backHref="?" title="Individual uploads" subtitle="Shown under “More”, below the folders" />
        <AddMediaPanel clientSlug={clientSlug} folderId={null} />
        <FolderItems
          clientSlug={clientSlug}
          items={items.filter((item) => !item.folderId)}
          variantsByItem={variantsByItem}
        />
      </div>
    );
  }
  return <FolderOverview clientSlug={clientSlug} folders={folders} items={items} />;
}

function FolderOverview({
  clientSlug,
  folders,
  items,
}: {
  clientSlug: string;
  folders: Folder[];
  items: MediaItem[];
}) {
  const ungrouped = items.filter((item) => !item.folderId);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-subhead text-ink">Folders</p>
          <p className="text-caption text-ink-muted">One folder per day or event. Newest shows first.</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <NewFolderCard clientSlug={clientSlug} />
        {folders.map((folder) => {
          const folderItems = items.filter((item) => item.folderId === folder.id);
          const cover = folderCover(folder, folderItems);
          return (
            <Link
              key={folder.id}
              href={`?folder=${folder.id}`}
              className="focus-brand group flex flex-col overflow-hidden rounded-2xl bg-paper-raised ring-1 ring-line transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="relative aspect-[4/3] bg-espresso">
                {cover && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cover} alt="" className="h-full w-full object-cover" />
                )}
                {!cover && (
                  <span className="absolute inset-0 flex items-center justify-center text-caption text-golden-hour/70">
                    No photos yet
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-0.5 p-3 sm:p-4">
                <p className="text-label font-bold text-ink">{folder.name}</p>
                <p className="text-caption text-ink-muted">
                  {[formatDate(folder.eventDate), counts(folderItems)].filter(Boolean).join(" · ")}
                </p>
              </div>
            </Link>
          );
        })}
        {ungrouped.length > 0 && (
          <Link
            href={`?folder=${INDIVIDUAL}`}
            className="focus-brand flex flex-col justify-end gap-0.5 rounded-2xl bg-paper-raised p-4 ring-1 ring-line transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <p className="text-label font-bold text-ink">Individual uploads</p>
            <p className="text-caption text-ink-muted">{counts(ungrouped)} · not in a folder</p>
          </Link>
        )}
      </div>
      {ungrouped.length === 0 && (
        <Link href={`?folder=${INDIVIDUAL}`} className="focus-brand w-fit text-caption text-purple-text underline">
          Add something outside a folder
        </Link>
      )}
    </div>
  );
}

function NewFolderCard({ clientSlug }: { clientSlug: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function create(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return setError("Name the folder.");
    setBusy(true);
    setError(undefined);
    const res = await fetch(`/api/admin/clients/${clientSlug}/folders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), eventDate: date || null }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(data.error || "Could not create folder.");
    setName("");
    setDate("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="focus-brand flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line text-ink-muted transition hover:border-ink-muted hover:text-ink"
      >
        <span className="text-[32px] leading-none">+</span>
        <span className="text-label">New day / event</span>
      </button>
    );
  }

  return (
    <form onSubmit={create} className="col-span-2 flex flex-col gap-3 rounded-2xl bg-paper-raised p-4 ring-1 ring-line lg:col-span-1">
      <p className="text-label font-bold text-ink">New day / event</p>
      <input
        autoFocus
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="e.g. Jersey Day Reveal"
        className="focus-brand rounded border border-line bg-paper px-3 py-2 text-body text-ink"
      />
      <label className="flex flex-col gap-1 text-caption text-ink-muted">
        Event date
        <input
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          className="focus-brand rounded border border-line bg-paper px-3 py-2 text-body text-ink"
        />
      </label>
      {error && <p className="text-caption text-red-700">{error}</p>}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="focus-brand rounded-full bg-highlighter px-5 py-2 text-label font-bold text-on-highlighter disabled:opacity-60"
        >
          {busy ? "Creating…" : "Create"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="focus-brand text-label text-ink-muted underline">
          Cancel
        </button>
      </div>
    </form>
  );
}

function WorkspaceHeader({
  backHref,
  title,
  subtitle,
  children,
}: {
  backHref: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <Link href={backHref} className="focus-brand w-fit text-label text-purple-text underline">
        ← All folders
      </Link>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-headline text-ink">{title}</h2>
          {subtitle && <p className="text-caption text-ink-muted">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}

function FolderWorkspace({
  clientSlug,
  folder,
  items,
  variantsByItem,
}: {
  clientSlug: string;
  folder: Folder;
  items: MediaItem[];
  variantsByItem: Record<string, MediaVariant[]>;
}) {
  const router = useRouter();
  const [name, setName] = useState(folder.name);
  const [date, setDate] = useState(folder.eventDate ?? "");
  const [saving, setSaving] = useState(false);
  const [coverBusy, setCoverBusy] = useState(false);
  const [message, setMessage] = useState<string | undefined>();
  const cover = folderCover(folder, items);
  const dirty = name.trim() !== folder.name || date !== (folder.eventDate ?? "");

  async function saveDetails() {
    setSaving(true);
    setMessage(undefined);
    try {
      await patchFolder(folder.id, { name: name.trim() || folder.name, eventDate: date || null });
      setMessage("Saved ✓");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  async function setCover(item: MediaItem) {
    await patchFolder(folder.id, { coverMediaId: item.id, coverUrl: null });
    router.refresh();
  }

  async function replaceCover(file: File | undefined) {
    if (!file) return;
    setCoverBusy(true);
    setMessage(undefined);
    try {
      const uploaded = await uploadToCloudinary(await compressImageIfNeeded(file), `clients/${clientSlug}`);
      await patchFolder(folder.id, { coverUrl: uploaded.secure_url });
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not replace the cover.");
    } finally {
      setCoverBusy(false);
    }
  }

  async function removeCustomCover() {
    await patchFolder(folder.id, { coverUrl: null });
    router.refresh();
  }

  async function removeFolder() {
    const warning =
      items.length > 0
        ? `Delete "${folder.name}" and all ${items.length} item${items.length === 1 ? "" : "s"} inside it? This removes them from Cloudinary too.`
        : `Delete the empty folder "${folder.name}"?`;
    if (!confirm(warning)) return;
    await fetch(`/api/admin/folders/${folder.id}`, { method: "DELETE" });
    router.push("?");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <WorkspaceHeader backHref="?" title={folder.name} subtitle={counts(items)}>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`?tab=preview&folder=${folder.id}`}
            className="focus-brand rounded-full bg-ink px-4 py-2 text-label text-paper transition hover:opacity-90"
          >
            Preview as client
          </Link>
        </div>
      </WorkspaceHeader>

      <div className="grid grid-cols-1 gap-4 rounded-2xl bg-paper-raised p-5 ring-1 ring-line sm:grid-cols-[140px_1fr] sm:p-6">
        <div className="flex flex-col gap-1">
          <span className="text-label text-ink">Folder cover</span>
          <div className="aspect-[4/5] overflow-hidden rounded-xl bg-espresso">
            {cover && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt="" className="h-full w-full object-cover" />
            )}
          </div>
          <label className="focus-brand mt-1 inline-flex w-fit cursor-pointer rounded-full bg-ink px-4 py-2 text-label text-paper transition hover:opacity-90">
            {coverBusy ? "Uploading…" : "Replace cover image"}
            <input
              type="file"
              accept="image/*"
              disabled={coverBusy}
              onChange={(event) => {
                replaceCover(event.target.files?.[0]);
                event.target.value = "";
              }}
              className="sr-only"
            />
          </label>
          {folder.coverUrl && (
            <button type="button" onClick={removeCustomCover} className="focus-brand w-fit text-caption text-purple-text underline">
              Remove custom cover
            </button>
          )}
          <span className="text-caption text-ink-muted">Or tap “Use as folder cover” on any photo below.</span>
        </div>
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-label text-ink">Folder name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="focus-brand rounded border border-line bg-paper px-4 py-3 text-body text-ink"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-label text-ink">Event date</span>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="focus-brand w-fit rounded border border-line bg-paper px-4 py-3 text-body text-ink"
            />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={saveDetails}
              disabled={!dirty || saving}
              className="focus-brand rounded-full bg-highlighter px-5 py-2 text-label font-bold text-on-highlighter disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            {message && <span className="text-caption text-ink-muted">{message}</span>}
            <button
              type="button"
              onClick={removeFolder}
              className="focus-brand ml-auto text-label text-red-700 underline"
            >
              Delete folder
            </button>
          </div>
        </div>
      </div>

      <AddMediaPanel clientSlug={clientSlug} folderId={folder.id} />

      <div className="flex flex-col gap-3">
        <p className="text-subhead text-ink">In this folder</p>
        <FolderItems
          clientSlug={clientSlug}
          items={items}
          variantsByItem={variantsByItem}
          coverId={folder.coverMediaId}
          onSetCover={setCover}
        />
      </div>
    </div>
  );
}
