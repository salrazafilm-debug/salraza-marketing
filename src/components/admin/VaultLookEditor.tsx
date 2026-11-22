"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { VaultLook } from "@/lib/vault-look";
import type { Background, Hover } from "@/components/site/layout-types";

const BG: [Background, string][] = [
  ["page", "Page"],
  ["light", "Light"],
  ["dark", "Dark"],
  ["color", "Colour"],
  ["gradient", "Gradient"],
];
const HOVER: [Hover, string][] = [
  ["none", "None"],
  ["zoom", "Zoom"],
  ["tilt", "Tilt"],
  ["lift", "Lift"],
];

function Pills<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map(([v, text]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
            value === v ? "bg-spark text-[#160b0d]" : "bg-ink/5 text-ink hover:bg-ink/10"
          }`}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

/** Edit how one client's vault page looks; the preview beside it reloads after saving. */
export function VaultLookEditor({ slug, initial, clientName }: { slug: string; initial: VaultLook; clientName: string }) {
  const router = useRouter();
  const [look, setLook] = useState<VaultLook>(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const set = (patch: Partial<VaultLook>) => {
    setLook((l) => ({ ...l, ...patch }));
    setStatus("idle");
  };

  async function save() {
    setStatus("saving");
    const res = await fetch(`/api/admin/clients/${slug}/look`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ look }),
    }).catch(() => null);
    if (res?.ok) {
      setStatus("saved");
      router.refresh();
    } else setStatus("error");
  }

  const bg = look.bg ?? "page";
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-line bg-paper-raised/70 p-5">
      <div>
        <p className="text-label text-ink">Vault look</p>
        <p className="text-caption text-ink-muted">Style this family&apos;s vault page. Saving updates the preview.</p>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-caption font-bold text-ink">Small label above the title</span>
        <input
          value={look.eyebrow ?? ""}
          placeholder={clientName}
          onChange={(e) => set({ eyebrow: e.target.value })}
          className="focus-brand rounded border border-line bg-paper px-3 py-2 text-sm text-ink"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-caption font-bold text-ink">Welcome message under the title</span>
        <textarea
          value={look.intro ?? ""}
          rows={3}
          placeholder="Optional — a few warm words for this family."
          onChange={(e) => set({ intro: e.target.value })}
          className="focus-brand rounded border border-line bg-paper px-3 py-2 text-sm text-ink"
        />
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-caption font-bold text-ink">Background</span>
        <Pills value={bg} options={BG} onChange={(v) => set({ bg: v })} />
        {(bg === "color" || bg === "gradient") && (
          <div className="flex flex-wrap items-center gap-3">
            <input type="color" value={look.color1 ?? "#8e1b3a"} onChange={(e) => set({ color1: e.target.value })} className="h-8 w-10 cursor-pointer rounded border border-line" title="Colour" />
            {bg === "gradient" && (
              <>
                <input type="color" value={look.color2 ?? "#160b0d"} onChange={(e) => set({ color2: e.target.value })} className="h-8 w-10 cursor-pointer rounded border border-line" title="Second colour" />
                <label className="flex flex-1 items-center gap-2 text-caption text-ink-muted">
                  {look.angle ?? 160}°
                  <input type="range" min={0} max={360} value={look.angle ?? 160} onChange={(e) => set({ angle: Number(e.target.value) })} className="flex-1" />
                </label>
              </>
            )}
          </div>
        )}
        {bg !== "page" && (
          <label className="flex items-center gap-2 text-caption text-ink">
            <input type="checkbox" checked={!!look.grain} onChange={(e) => set({ grain: e.target.checked })} />
            Film grain texture
          </label>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-caption font-bold text-ink">Photo hover effect</span>
        <Pills value={look.hover ?? "none"} options={HOVER} onChange={(v) => set({ hover: v })} />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={status === "saving"}
          className="focus-brand rounded-full bg-spark px-5 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-[#160b0d] transition-colors hover:bg-accent hover:text-white disabled:opacity-50"
        >
          {status === "saving" ? "Saving…" : "Save look"}
        </button>
        {status === "saved" && <span className="text-caption text-ink-muted">✓ Saved</span>}
        {status === "error" && <span className="text-caption text-accent-bright">Couldn&apos;t save — try again</span>}
        <button type="button" onClick={() => set({ bg: "page", grain: false, hover: "none", eyebrow: "", intro: "" })} className="text-caption text-ink-muted underline">
          Reset
        </button>
      </div>
    </div>
  );
}
