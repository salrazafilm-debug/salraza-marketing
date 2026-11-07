"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { compressImageIfNeeded, uploadToCloudinary } from "@/lib/upload-client";

type FileJob = { name: string; progress: number; status: "waiting" | "uploading" | "done" | "error"; error?: string };

async function saveMedia(clientSlug: string, body: Record<string, unknown>) {
  const res = await fetch(`/api/admin/clients/${clientSlug}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Could not save.");
}

/**
 * Adds media straight into one folder (or to individual uploads when
 * folderId is null): drop/choose many photos & videos at once, or add a
 * cloud-drive video link with its own thumbnail.
 */
export function AddMediaPanel({ clientSlug, folderId }: { clientSlug: string; folderId: string | null }) {
  const router = useRouter();
  const [mode, setMode] = useState<"files" | "link">("files");

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-line bg-paper-raised p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-subhead text-ink">Add to this {folderId ? "folder" : "section"}</p>
        <div className="flex rounded-full bg-paper p-1 ring-1 ring-line" role="tablist">
          {([
            ["files", "Photos & videos"],
            ["link", "Video link"],
          ] as const).map(([value, text]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={mode === value}
              onClick={() => setMode(value)}
              className={`focus-brand rounded-full px-4 py-2 text-label transition ${
                mode === value ? "bg-ink text-paper" : "text-ink hover:bg-line"
              }`}
            >
              {text}
            </button>
          ))}
        </div>
      </div>

      {mode === "files" ? (
        <FileDrop clientSlug={clientSlug} folderId={folderId} onDone={() => router.refresh()} />
      ) : (
        <VideoLinkForm clientSlug={clientSlug} folderId={folderId} onDone={() => router.refresh()} />
      )}
    </div>
  );
}

function FileDrop({
  clientSlug,
  folderId,
  onDone,
}: {
  clientSlug: string;
  folderId: string | null;
  onDone: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [jobs, setJobs] = useState<FileJob[]>([]);
  const [dragging, setDragging] = useState(false);
  const busy = jobs.some((job) => job.status === "uploading" || job.status === "waiting");

  async function uploadAll(files: File[]) {
    if (files.length === 0) return;
    setJobs(files.map((file) => ({ name: file.name, progress: 0, status: "waiting" })));
    const update = (index: number, patch: Partial<FileJob>) =>
      setJobs((prev) => prev.map((job, i) => (i === index ? { ...job, ...patch } : job)));

    // One at a time keeps memory low on phones and keeps upload order = gallery order.
    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      const resourceType: "image" | "video" = file.type.startsWith("video/") ? "video" : "image";
      update(index, { status: "uploading" });
      try {
        const uploadFile = resourceType === "image" ? await compressImageIfNeeded(file) : file;
        const result = await uploadToCloudinary(uploadFile, `clients/${clientSlug}`, resourceType, (progress) =>
          update(index, { progress })
        );
        await saveMedia(clientSlug, {
          type: resourceType,
          label: file.name.replace(/\.[^.]+$/, ""),
          src: result.secure_url,
          cloudinaryPublicId: result.public_id,
          folderId,
        });
        update(index, { status: "done", progress: 100 });
      } catch (error) {
        update(index, { status: "error", error: error instanceof Error ? error.message : "Upload failed." });
      }
    }
    if (inputRef.current) inputRef.current.value = "";
    onDone();
  }

  return (
    <div className="flex flex-col gap-3">
      <label
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (!busy) uploadAll(Array.from(event.dataTransfer.files));
        }}
        className={`focus-within:ring-2 focus-within:ring-focus-ring flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
          dragging ? "border-purple-text bg-paper" : "border-line bg-paper hover:border-ink-muted"
        } ${busy ? "pointer-events-none opacity-60" : ""}`}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-ink-muted" aria-hidden>
          <path d="M12 16V4M7 9l5-5 5 5" />
          <path d="M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" />
        </svg>
        <span className="text-label text-ink">Tap to choose, or drop files here</span>
        <span className="text-caption text-ink-muted">Pick as many photos and videos as you want</span>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          disabled={busy}
          onChange={(event) => uploadAll(Array.from(event.target.files ?? []))}
          className="sr-only"
        />
      </label>

      {jobs.length > 0 && (
        <ul className="flex flex-col gap-1 text-caption">
          {jobs.map((job, index) => (
            <li key={index} className="flex items-center justify-between gap-3 rounded bg-paper px-3 py-2">
              <span className="truncate text-ink">{job.name}</span>
              <span
                className={
                  job.status === "error" ? "shrink-0 text-red-700" : job.status === "done" ? "shrink-0 text-green-700" : "shrink-0 text-ink-muted"
                }
              >
                {job.status === "waiting" && "Waiting"}
                {job.status === "uploading" && `${job.progress}%`}
                {job.status === "done" && "Added ✓"}
                {job.status === "error" && job.error}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function VideoLinkForm({
  clientSlug,
  folderId,
  onDone,
}: {
  clientSlug: string;
  folderId: string | null;
  onDone: () => void;
}) {
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [thumb, setThumb] = useState<File | null>(null);
  const [thumbPreview, setThumbPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [saved, setSaved] = useState(false);

  function chooseThumb(file: File | null) {
    setThumb(file);
    setThumbPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(undefined);
    setSaved(false);
    const link = url.trim();
    if (!title.trim()) return setError("Give the video a title.");
    if (!/^https?:\/\//i.test(link)) return setError("Paste the full link, starting with https://");
    if (!thumb) return setError("Choose a thumbnail image.");

    setBusy(true);
    try {
      const uploaded = await uploadToCloudinary(await compressImageIfNeeded(thumb), `clients/${clientSlug}`);
      await saveMedia(clientSlug, {
        type: "video",
        label: title.trim(),
        caption: caption.trim(),
        src: link,
        externalUrl: link,
        thumbnailUrl: uploaded.secure_url,
        cloudinaryPublicId: uploaded.public_id,
        folderId,
      });
      setTitle("");
      setUrl("");
      setCaption("");
      chooseThumb(null);
      if (thumbInputRef.current) thumbInputRef.current.value = "";
      setSaved(true);
      onDone();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save the video link.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-[160px_1fr]">
      <label className="flex cursor-pointer flex-col gap-2">
        <span className="text-label text-ink">Thumbnail</span>
        <span className="relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-line bg-paper text-center text-caption text-ink-muted hover:border-ink-muted">
          {thumbPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumbPreview} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <span className="px-3">Tap to choose an image</span>
          )}
        </span>
        <input
          ref={thumbInputRef}
          type="file"
          accept="image/*"
          onChange={(event) => chooseThumb(event.target.files?.[0] ?? null)}
          className="sr-only"
        />
      </label>

      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-label text-ink">Video title</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Game highlights"
            className="focus-brand rounded border border-line bg-paper px-4 py-3 text-body text-ink"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-label text-ink">Cloud drive link</span>
          <input
            type="url"
            inputMode="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://drive.google.com/…"
            className="focus-brand rounded border border-line bg-paper px-4 py-3 text-body text-ink"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-label text-ink">Caption (optional)</span>
          <input
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            placeholder="e.g. 2:14"
            className="focus-brand rounded border border-line bg-paper px-4 py-3 text-body text-ink"
          />
        </label>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={busy}
            className="focus-brand rounded-full bg-highlighter px-6 py-3 text-label font-bold text-on-highlighter transition hover:brightness-95 disabled:opacity-60"
          >
            {busy ? "Saving…" : "Add video link"}
          </button>
          {saved && <span className="text-caption text-green-700">Added ✓</span>}
        </div>
        {error && <p className="text-caption text-red-700">{error}</p>}
      </div>
    </form>
  );
}
