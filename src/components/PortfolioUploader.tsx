"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { PORTFOLIO_CATEGORIES, type PortfolioCategory } from "@/lib/portfolio";

// Cloudinary's plan caps a single image at 10MB — stay a little under that.
const MAX_IMAGE_BYTES = 9.5 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 4000;

async function compressImageIfNeeded(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.size <= MAX_IMAGE_BYTES) return file;

  const bitmap = await createImageBitmap(file);
  let width = bitmap.width;
  let height = bitmap.height;
  if (Math.max(width, height) > MAX_IMAGE_DIMENSION) {
    const scale = MAX_IMAGE_DIMENSION / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  let blob: Blob | null = null;
  let quality = 0.9;
  for (let attempt = 0; attempt < 6; attempt++) {
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(bitmap, 0, 0, width, height);
    blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));

    if (blob && blob.size <= MAX_IMAGE_BYTES) break;
    if (quality > 0.5) {
      quality -= 0.15;
    } else {
      width = Math.round(width * 0.75);
      height = Math.round(height * 0.75);
    }
  }

  bitmap.close();
  if (!blob) return file;

  const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], newName, { type: "image/jpeg" });
}

type Signature = { timestamp: number; signature: string; apiKey: string; cloudName: string; folder: string };

/** Uploads one file straight to Cloudinary and saves it as a portfolio item. */
async function uploadOne(
  file: File,
  title: string,
  category: PortfolioCategory,
  onProgress: (pct: number) => void
): Promise<void> {
  const uploadFile = file.size > MAX_IMAGE_BYTES ? await compressImageIfNeeded(file) : file;

  const signatureRes = await fetch("/api/admin/cloudinary-signature", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder: "portfolio" }),
  });
  const signatureData = (await signatureRes.json()) as Signature & { error?: string };
  if (!signatureRes.ok) throw new Error(signatureData.error || "Could not start upload.");
  const { timestamp, signature, apiKey, cloudName, folder } = signatureData;

  const formData = new FormData();
  formData.append("file", uploadFile);
  formData.append("api_key", apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature);
  formData.append("folder", folder);

  const uploadResult = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);
    xhr.upload.onprogress = (progressEvent) => {
      if (progressEvent.lengthComputable) onProgress(Math.round((progressEvent.loaded / progressEvent.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        let reason = `Cloudinary upload failed (${xhr.status}).`;
        try {
          const parsed = JSON.parse(xhr.responseText);
          if (parsed?.error?.message) reason = `Cloudinary: ${parsed.error.message}`;
        } catch {
          // Response wasn't JSON — stick with the generic reason above.
        }
        reject(new Error(reason));
      }
    };
    xhr.onerror = () => reject(new Error("Cloudinary upload failed — check your connection."));
    xhr.send(formData);
  });

  const saveRes = await fetch("/api/admin/portfolio", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title,
      category,
      image: uploadResult.secure_url,
      cloudinaryPublicId: uploadResult.public_id,
    }),
  });
  const saveData = await saveRes.json();
  if (!saveRes.ok) throw new Error(saveData.error || "Could not save the portfolio item.");
}

/**
 * Adds photos to the public /portfolio page and homepage gallery. Pick (or
 * drop) as many photos as you like; they upload one after another. A name is
 * optional — photos without one simply show no name.
 */
export function PortfolioUploader() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<PortfolioCategory>(PORTFOLIO_CATEGORIES[0]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | undefined>();
  const [errors, setErrors] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);

  async function uploadAll(files: File[]) {
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (!images.length) return;
    setBusy(true);
    setErrors([]);
    const failed: string[] = [];
    for (let i = 0; i < images.length; i++) {
      const file = images[i];
      const label = images.length > 1 ? `Photo ${i + 1} of ${images.length}` : "Uploading";
      setStatus(`${label}… 0%`);
      try {
        await uploadOne(file, title.trim(), category, (pct) => setStatus(`${label}… ${pct}%`));
      } catch (e) {
        failed.push(`${file.name}: ${e instanceof Error ? e.message : "failed"}`);
      }
    }
    setBusy(false);
    setStatus(
      failed.length
        ? `${images.length - failed.length} of ${images.length} uploaded.`
        : `✓ ${images.length} photo${images.length === 1 ? "" : "s"} added.`
    );
    setErrors(failed);
    setTitle("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    router.refresh();
  }

  return (
    <div
      className={`flex flex-col gap-4 rounded-xl border-2 border-dashed p-6 transition ${
        dragging ? "border-spark bg-spark/10" : "border-transparent bg-paper-raised"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (!busy) uploadAll(Array.from(e.dataTransfer.files));
      }}
    >
      <div>
        <p className="text-subhead text-ink">Add to portfolio</p>
        <p className="text-caption text-ink-muted">Choose or drop as many photos as you like — they upload one after another.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-label text-ink">Name (optional)</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Leave empty for no name"
            className="focus-brand rounded border border-line bg-paper px-4 py-3 text-body text-ink"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-label text-ink">Category</span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value as PortfolioCategory)}
            className="focus-brand rounded border border-line bg-paper px-4 py-3 text-body text-ink"
          >
            {PORTFOLIO_CATEGORIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label
        className={`focus-brand inline-flex w-fit cursor-pointer items-center justify-center rounded-full bg-highlighter px-6 py-3 text-label text-on-highlighter transition hover:brightness-95 ${
          busy ? "pointer-events-none opacity-50" : ""
        }`}
      >
        {busy ? "Uploading…" : "Choose photos"}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          disabled={busy}
          onChange={(event) => uploadAll(Array.from(event.target.files ?? []))}
          className="hidden"
        />
      </label>

      {status && <p className="text-caption text-ink-muted">{status}</p>}
      {errors.map((e) => (
        <p key={e} className="text-caption text-red-700">
          {e}
        </p>
      ))}
    </div>
  );
}
