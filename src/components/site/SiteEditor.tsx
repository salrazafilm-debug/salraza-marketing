"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { EditProvider } from "./Editable";
import { HomeSections, type EditorControls, type Slots } from "./HomeSections";
import { SECTION_LIBRARY, type HomeLayout, type SectionType } from "./layout-types";

export const DRAFT_KEY = "salraza-homepage-draft";

/**
 * Admin site editor: the real homepage, editable in place. Click any words to
 * change them, use each section's toolbar to move / hide / delete it, and the
 * "+ Add section" buttons to insert new ones. Nothing goes live until Save.
 * "Phone view" shows the unsaved draft in a phone-sized frame.
 */
export function SiteEditor({ initial, slots }: { initial: HomeLayout; slots: Slots }) {
  const [layout, setLayout] = useState(initial);
  const [saved, setSaved] = useState(JSON.stringify(initial));
  const [history, setHistory] = useState<HomeLayout[]>([]);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");
  const [phone, setPhone] = useState(false);
  const dirty = JSON.stringify(layout) !== saved;

  const update = useCallback((fn: (l: HomeLayout) => HomeLayout) => {
    setLayout((prev) => {
      setHistory((h) => [...h.slice(-49), prev]);
      return fn(prev);
    });
    setStatus("idle");
  }, []);

  // Share the draft with the phone preview frame (same origin).
  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(layout));
      window.dispatchEvent(new Event("salraza-draft"));
    } catch {}
  }, [layout]);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const onLeave = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [dirty]);

  const controls: EditorControls = useMemo(
    () => ({
      move: (id, dir) =>
        update((l) => {
          const i = l.sections.findIndex((s) => s.id === id);
          const j = i + dir;
          if (i < 0 || j < 0 || j >= l.sections.length) return l;
          const next = [...l.sections];
          [next[i], next[j]] = [next[j], next[i]];
          return { ...l, sections: next };
        }),
      toggleHidden: (id) =>
        update((l) => ({ ...l, sections: l.sections.map((s) => (s.id === id ? { ...s, hidden: !s.hidden } : s)) })),
      remove: (id) => update((l) => ({ ...l, sections: l.sections.filter((s) => s.id !== id) })),
      add: (index: number, type: SectionType) =>
        update((l) => {
          const id = SECTION_LIBRARY[type].single ? type : `${type}-${Math.random().toString(36).slice(2, 8)}`;
          const next = [...l.sections];
          next.splice(index, 0, { id, type, text: {} });
          return { ...l, sections: next };
        }),
    }),
    [update]
  );

  const editApi = useMemo(
    () => ({
      editing: true,
      setText: (sectionId: string, key: string, value: string) =>
        update((l) => ({
          ...l,
          sections: l.sections.map((s) => (s.id === sectionId ? { ...s, text: { ...s.text, [key]: value } } : s)),
        })),
    }),
    [update]
  );

  async function save() {
    setStatus("saving");
    setError("");
    const res = await fetch("/api/admin/homepage-layout", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ layout }),
    }).catch(() => null);
    if (res?.ok) {
      setSaved(JSON.stringify(layout));
      setStatus("saved");
    } else {
      setStatus("error");
      setError(res ? ((await res.json().catch(() => ({}))) as { error?: string }).error ?? "Save failed." : "Network error.");
    }
  }

  async function resetToDefault() {
    if (!confirm("Reset the homepage to the original design and words? This replaces the live homepage.")) return;
    const res = await fetch("/api/admin/homepage-layout", { method: "DELETE" }).catch(() => null);
    if (res?.ok) {
      const { layout: fresh } = (await res.json()) as { layout: HomeLayout };
      setHistory((h) => [...h, layout]);
      setLayout(fresh);
      setSaved(JSON.stringify(fresh));
      setStatus("saved");
    } else {
      setStatus("error");
      setError("Reset failed.");
    }
  }

  const btn = "rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] transition disabled:opacity-40";

  return (
    <>
      <EditProvider value={editApi}>
        <HomeSections layout={layout} slots={slots} editor={controls} />
      </EditProvider>

      {phone && (
        <div className="fixed bottom-24 right-4 z-[90] overflow-hidden rounded-[2.2rem] border-[10px] border-[#050304] shadow-2xl" data-mode="dark">
          <iframe title="Phone preview" src="/admin/dashboard/site/frame" className="h-[640px] w-[340px] bg-[#0d090a]" />
        </div>
      )}

      {/* Editor bar */}
      <div className="fixed inset-x-0 bottom-4 z-[95] flex justify-center px-3" data-mode="dark">
        <div className="flex max-w-full flex-wrap items-center justify-center gap-1.5 rounded-2xl border border-[#3a2a2d] bg-[#0d090a]/95 p-2 text-[#f4efe9] shadow-2xl backdrop-blur sm:rounded-full">
          <span className="px-3 text-[11px] uppercase tracking-[0.15em] text-[#b3a5a2]">
            {status === "saving"
              ? "Saving…"
              : status === "saved" && !dirty
                ? "✓ Saved — live"
                : status === "error"
                  ? `⚠ ${error}`
                  : dirty
                    ? "● Unsaved changes"
                    : "Click any words to edit"}
          </span>
          <button
            type="button"
            className={`${btn} hover:bg-white/10`}
            disabled={history.length === 0}
            onClick={() => {
              const prev = history[history.length - 1];
              if (!prev) return;
              setLayout(prev);
              setHistory((h) => h.slice(0, -1));
            }}
          >
            ↶ Undo
          </button>
          <button type="button" className={`${btn} ${phone ? "bg-white/15" : "hover:bg-white/10"}`} onClick={() => setPhone((p) => !p)}>
            📱 Phone view
          </button>
          <button type="button" className={`${btn} hover:bg-white/10`} onClick={resetToDefault}>
            Reset
          </button>
          <Link href="/" target="_blank" className={`${btn} hover:bg-white/10`}>
            View live ↗
          </Link>
          <button
            type="button"
            className={`${btn} bg-[#f5c84c] text-[#160b0d] hover:bg-[#8e1b3a] hover:text-white`}
            disabled={!dirty || status === "saving"}
            onClick={save}
          >
            Save &amp; publish
          </button>
        </div>
      </div>
    </>
  );
}
