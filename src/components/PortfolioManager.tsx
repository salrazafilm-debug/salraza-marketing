"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { PortfolioItem, PortfolioVariant } from "@/lib/portfolio";

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

async function uploadToCloudinary(file: File): Promise<{ secure_url: string; public_id: string }> {
  const signatureRes = await fetch("/api/admin/cloudinary-signature", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder: "portfolio" }),
  });
  const signatureData = await signatureRes.json();
  if (!signatureRes.ok) throw new Error(signatureData.error || "Could not start upload.");

  const { timestamp, signature, apiKey, cloudName, folder } = signatureData;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature);
  formData.append("folder", folder);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);
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
}

function VariantsSection({
  itemId,
  variants,
}: {
  itemId: string;
  variants: PortfolioVariant[];
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
      const uploadResult = await uploadToCloudinary(uploadFile);

      const saveRes = await fetch(`/api/admin/portfolio/${itemId}/variants`, {
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

  async function handleDeleteVariant(variant: PortfolioVariant) {
    if (!confirm("Remove this variant?")) return;
    setBusyVariantId(variant.id);
    await fetch(`/api/admin/portfolio-variants/${variant.id}`, { method: "DELETE" });
    setBusyVariantId(null);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2 border-t border-line pt-3">
      <p className="text-caption font-bold text-ink-muted">
        Variants {variants.length > 0 && `(${variants.length + 1} total)`}
      </p>

      {variants.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {variants.map((variant) => (
            <div key={variant.id} className="relative h-16 w-16 overflow-hidden rounded-lg bg-espresso">
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

export function PortfolioManager({
  items,
  variantsByItem,
}: {
  items: PortfolioItem[];
  variantsByItem: Record<string, PortfolioVariant[]>;
}) {
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
            <img src={item.images[0]} alt={item.title} className="h-full w-full object-cover" />
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

          <VariantsSection itemId={item.id} variants={variantsByItem[item.id] ?? []} />
        </div>
      ))}
    </div>
  );
}
