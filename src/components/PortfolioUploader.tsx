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

/** Adds a new photo to the public /portfolio page and homepage gallery. */
export function PortfolioUploader() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<PortfolioCategory>(PORTFOLIO_CATEGORIES[0]);
  const [progress, setProgress] = useState<number | null>(null);
  const [status, setStatus] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!title.trim()) {
      setError("Add a title before choosing a photo.");
      event.target.value = "";
      return;
    }

    setError(undefined);
    setProgress(0);

    try {
      let uploadFile = file;
      if (file.size > MAX_IMAGE_BYTES) {
        setStatus("Compressing large photo…");
        uploadFile = await compressImageIfNeeded(file);
        setStatus(undefined);
      }

      const signatureRes = await fetch("/api/admin/cloudinary-signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: "portfolio" }),
      });
      const signatureData = await signatureRes.json();
      if (!signatureRes.ok) throw new Error(signatureData.error || "Could not start upload.");

      const { timestamp, signature, apiKey, cloudName, folder } = signatureData;

      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("api_key", apiKey);
      formData.append("timestamp", String(timestamp));
      formData.append("signature", signature);
      formData.append("folder", folder);

      const uploadResult = await new Promise<{ secure_url: string; public_id: string }>(
        (resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);
          xhr.upload.onprogress = (progressEvent) => {
            if (progressEvent.lengthComputable) {
              setProgress(Math.round((progressEvent.loaded / progressEvent.total) * 100));
            }
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
        }
      );

      const saveRes = await fetch("/api/admin/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          category,
          image: uploadResult.secure_url,
          cloudinaryPublicId: uploadResult.public_id,
        }),
      });
      const saveData = await saveRes.json();
      if (!saveRes.ok) throw new Error(saveData.error || "Could not save the portfolio item.");

      setProgress(null);
      setTitle("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      router.refresh();
    } catch (uploadError) {
      setProgress(null);
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-paper-raised p-6">
      <p className="text-subhead text-ink">Add to portfolio</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-label text-ink">Title</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Stadium concert lights"
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

      <label className="focus-brand inline-flex w-fit cursor-pointer items-center justify-center rounded-full bg-highlighter px-6 py-3 text-label text-on-highlighter transition hover:brightness-95">
        Choose a photo
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </label>

      {progress !== null && <p className="text-caption text-ink-muted">Uploading… {progress}%</p>}
      {status && <p className="text-caption text-ink-muted">{status}</p>}
      {error && <p className="text-caption text-red-700">{error}</p>}
    </div>
  );
}
