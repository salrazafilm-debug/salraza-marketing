"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { Folder } from "@/lib/clients";

type UploadState = { fileName: string; progress: number; error?: string } | null;

const NEW_FOLDER_VALUE = "__new__";

/**
 * Uploads a file straight from the browser to Cloudinary (not through our
 * own server) so large video files don't hit Vercel's serverless
 * request-size limit. Our server only ever sees a small signature request
 * beforehand and a small metadata request afterward.
 */
export function MediaUploader({ clientSlug, folders }: { clientSlug: string; folders: Folder[] }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [label, setLabel] = useState("");
  const [caption, setCaption] = useState("");
  const [folderId, setFolderId] = useState<string>("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [folderError, setFolderError] = useState<string | undefined>();
  const [upload, setUpload] = useState<UploadState>(null);

  function handleFolderSelect(value: string) {
    if (value === NEW_FOLDER_VALUE) {
      setCreatingFolder(true);
      return;
    }
    setFolderId(value);
  }

  async function handleCreateFolder() {
    const name = newFolderName.trim();
    if (!name) return;
    setFolderError(undefined);

    const res = await fetch(`/api/admin/clients/${clientSlug}/folders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();

    if (!res.ok) {
      setFolderError(data.error || "Could not create folder.");
      return;
    }

    setCreatingFolder(false);
    setNewFolderName("");
    router.refresh();
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const resourceType: "image" | "video" = file.type.startsWith("video/") ? "video" : "image";
    const effectiveLabel = label.trim() || file.name.replace(/\.[^.]+$/, "");
    setUpload({ fileName: file.name, progress: 0 });

    try {
      const signatureRes = await fetch("/api/admin/cloudinary-signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: `clients/${clientSlug}` }),
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

      const uploadResult = await new Promise<{ secure_url: string; public_id: string }>(
        (resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`);
          xhr.upload.onprogress = (progressEvent) => {
            if (progressEvent.lengthComputable) {
              setUpload({
                fileName: file.name,
                progress: Math.round((progressEvent.loaded / progressEvent.total) * 100),
              });
            }
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(JSON.parse(xhr.responseText));
            } else {
              reject(new Error("Cloudinary upload failed."));
            }
          };
          xhr.onerror = () => reject(new Error("Cloudinary upload failed."));
          xhr.send(formData);
        }
      );

      const saveRes = await fetch(`/api/admin/clients/${clientSlug}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: resourceType,
          label: effectiveLabel,
          caption,
          src: uploadResult.secure_url,
          cloudinaryPublicId: uploadResult.public_id,
          folderId: folderId || null,
        }),
      });
      const saveData = await saveRes.json();
      if (!saveRes.ok) throw new Error(saveData.error || "Could not save the upload.");

      setUpload(null);
      setLabel("");
      setCaption("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      router.refresh();
    } catch (error) {
      setUpload({
        fileName: file.name,
        progress: 0,
        error: error instanceof Error ? error.message : "Upload failed.",
      });
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-paper-raised p-6">
      <p className="text-subhead text-ink">Upload finished work</p>

      <label className="flex flex-col gap-2">
        <span className="text-label text-ink">Folder</span>
        <select
          value={folderId}
          onChange={(event) => handleFolderSelect(event.target.value)}
          className="focus-brand rounded border border-line bg-paper px-4 py-3 text-body text-ink"
        >
          <option value="">No folder (individual upload)</option>
          {folders.map((folder) => (
            <option key={folder.id} value={folder.id}>
              {folder.name}
            </option>
          ))}
          <option value={NEW_FOLDER_VALUE}>+ Create new folder…</option>
        </select>
      </label>

      {creatingFolder && (
        <div className="flex flex-col gap-2 rounded border border-line bg-paper p-4">
          <span className="text-label text-ink">New folder name</span>
          <div className="flex gap-2">
            <input
              autoFocus
              value={newFolderName}
              onChange={(event) => setNewFolderName(event.target.value)}
              placeholder="e.g. Game Day Gallery"
              className="focus-brand flex-1 rounded border border-line bg-paper-raised px-4 py-2 text-body text-ink"
            />
            <button
              type="button"
              onClick={handleCreateFolder}
              className="focus-brand rounded-full bg-highlighter px-4 py-2 text-label text-on-highlighter transition hover:brightness-95"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => {
                setCreatingFolder(false);
                setNewFolderName("");
              }}
              className="focus-brand text-label text-ink-muted underline"
            >
              Cancel
            </button>
          </div>
          {folderError && <p className="text-caption text-red-700">{folderError}</p>}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-label text-ink">Label</span>
          <input
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="Defaults to the file name"
            className="focus-brand rounded border border-line bg-paper px-4 py-3 text-body text-ink"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-label text-ink">Caption (optional)</span>
          <input
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            placeholder="e.g. 48 photos, or 2:14"
            className="focus-brand rounded border border-line bg-paper px-4 py-3 text-body text-ink"
          />
        </label>
      </div>

      <label className="focus-brand inline-flex w-fit cursor-pointer items-center justify-center rounded-full bg-highlighter px-6 py-3 text-label text-on-highlighter transition hover:brightness-95">
        Choose a photo or video
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </label>

      {upload && (
        <div className="text-caption">
          {upload.error ? (
            <p className="text-red-700">{upload.error}</p>
          ) : (
            <p className="text-ink-muted">
              Uploading {upload.fileName}… {upload.progress}%
            </p>
          )}
        </div>
      )}
    </div>
  );
}
