"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { uploadToCloudinary } from "@/lib/upload-client";

type Setting = { mode: "original" | "custom"; customUrl: string | null; customName: string | null };

/** Swap the vault intro video: the original, or one you upload (for example a festive one). */
export function IntroVideoManager({ setting, originalSrc }: { setting: Setting; originalSrc: string }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | undefined>();

  async function save(body: Record<string, unknown>) {
    const res = await fetch("/api/admin/intro-video", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not save.");
    router.refresh();
  }

  async function choose(mode: "original" | "custom") {
    setBusy(true);
    setError(undefined);
    try {
      await save({ mode });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
    }
    setBusy(false);
  }

  async function upload(file: File) {
    if (!file.type.startsWith("video/")) {
      setError("Please choose a video file (MP4 works best).");
      return;
    }
    setBusy(true);
    setError(undefined);
    setProgress(0);
    try {
      const result = await uploadToCloudinary(file, "site", "video", setProgress);
      await save({ mode: "custom", customUrl: result.secure_url, customName: file.name });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    }
    setProgress(null);
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  const custom = setting.mode === "custom";
  const card = (active: boolean) =>
    `flex flex-col gap-3 rounded-xl border p-4 ${active ? "border-spark bg-paper-raised" : "border-line bg-paper"}`;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-line bg-paper-raised/70 p-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-warm-text">Vault intro</p>
        <p className="text-subhead text-ink">Intro video</p>
        <p className="text-caption text-ink-muted">
          The video that plays when a client enters their vault. Swap in a seasonal one (for example festive), then switch back to the
          original any time. Your uploaded video stays saved.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className={card(!custom)}>
          <p className="text-label text-ink">
            Original {!custom && <span className="ml-1 rounded-full bg-spark px-2 py-0.5 text-[10px] font-bold text-[#160b0d]">IN USE</span>}
          </p>
          <video src={originalSrc} controls muted preload="metadata" className="aspect-video w-full rounded bg-black object-contain" />
          <button
            type="button"
            disabled={busy || !custom}
            onClick={() => choose("original")}
            className="focus-brand rounded-full border border-line px-5 py-2.5 text-label text-ink transition hover:bg-paper disabled:opacity-50"
          >
            {custom ? "Switch back to original" : "Using original"}
          </button>
        </div>

        <div className={card(custom)}>
          <p className="text-label text-ink">
            Your uploaded video {custom && <span className="ml-1 rounded-full bg-spark px-2 py-0.5 text-[10px] font-bold text-[#160b0d]">IN USE</span>}
          </p>
          {setting.customUrl ? (
            <>
              <video src={setting.customUrl} controls muted preload="metadata" className="aspect-video w-full rounded bg-black object-contain" />
              {setting.customName && <p className="truncate text-caption text-ink-muted">{setting.customName}</p>}
              <button
                type="button"
                disabled={busy || custom}
                onClick={() => choose("custom")}
                className="focus-brand rounded-full bg-highlighter px-5 py-2.5 text-label text-on-highlighter transition hover:brightness-95 disabled:opacity-50"
              >
                {custom ? "Using this video" : "Use this video"}
              </button>
            </>
          ) : (
            <p className="flex aspect-video w-full items-center justify-center rounded border border-dashed border-line text-caption text-ink-muted">
              No video uploaded yet
            </p>
          )}
          <label
            className={`focus-brand inline-flex w-fit cursor-pointer items-center rounded-full border border-line px-5 py-2.5 text-label text-ink transition hover:bg-paper ${
              busy ? "pointer-events-none opacity-50" : ""
            }`}
          >
            {progress !== null ? `Uploading… ${progress}%` : setting.customUrl ? "Upload a different video" : "Upload a video"}
            <input
              ref={fileRef}
              type="file"
              accept="video/*"
              className="hidden"
              disabled={busy}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void upload(file);
              }}
            />
          </label>
        </div>
      </div>

      {error && <p className="text-caption text-red-700">{error}</p>}
      <p className="text-caption text-ink-muted">Tip: a short MP4 that fades to black at the end works best. The vault opens as soon as it finishes.</p>
    </div>
  );
}
