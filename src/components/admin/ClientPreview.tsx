"use client";

import { useState } from "react";

/**
 * Shows the client's real vault page in a frame, exactly as they see it.
 * `version` changes whenever the vault's content changes (after a save),
 * which remounts the frame so the preview stays current on its own.
 */
export function ClientPreview({ src, version }: { src: string; version: string }) {
  const [device, setDevice] = useState<"phone" | "desktop">("phone");
  const [reloads, setReloads] = useState(0);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex rounded-full bg-paper p-1 ring-1 ring-line">
          {(["phone", "desktop"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setDevice(value)}
              aria-pressed={device === value}
              className={`focus-brand rounded-full px-4 py-1.5 text-label capitalize transition ${
                device === value ? "bg-ink text-paper" : "text-ink hover:bg-line"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setReloads((n) => n + 1)}
            className="focus-brand text-label text-purple-text underline"
          >
            Reload
          </button>
          <a href={src} target="_blank" rel="noopener noreferrer" className="focus-brand text-label text-purple-text underline">
            Open full page ↗
          </a>
        </div>
      </div>

      <div className="flex justify-center rounded-2xl bg-line/60 p-3 sm:p-5">
        <iframe
          key={`${version}-${reloads}`}
          src={src}
          title="Client view preview"
          className={`h-[760px] rounded-xl border border-line bg-paper shadow-xl transition-all ${
            device === "phone" ? "w-[390px] max-w-full" : "w-full"
          }`}
        />
      </div>
    </div>
  );
}
