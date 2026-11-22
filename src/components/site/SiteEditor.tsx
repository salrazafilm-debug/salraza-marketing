"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EditProvider } from "./Editable";
import { HomeSections, type Slots } from "./HomeSections";
import {
  SECTION_LIBRARY,
  THEME_PRESETS,
  imagesOf,
  styleOf,
  type Background,
  type Entrance,
  type Height,
  type HomeLayout,
  type Hover,
  type Placement,
  type Section,
  type SectionStyle,
  type SectionType,
  type Theme,
} from "./layout-types";

export const DRAFT_KEY = "salraza-homepage-draft";

type HistoryRow = { index: number; at: string; sections: number };
type LibraryImage = { url: string; title: string; source: string };

/** A short random id for a new section (kept outside the component: event-time only). */
function newId(type: string) {
  return `${type}-${Math.random().toString(36).slice(2, 8)}`;
}

const GRADIENTS: [string, string, number][] = [
  ["#8e1b3a", "#160b0d", 160],
  ["#2a0d3d", "#f1a95f", 135],
  ["#0a4d68", "#0b1d26", 180],
  ["#f6efe6", "#f1cf9f", 180],
  ["#c164fc", "#8e1b3a", 120],
  ["#1d0d10", "#5c0f24", 90],
];

/* ---------- small UI helpers (always dark, regardless of page mode) ---------- */

const panel = "rounded-2xl border border-[#3a2a2d] bg-[#120c0e]/95 text-[#f4efe9] shadow-2xl backdrop-blur";
const label = "text-[10px] font-bold uppercase tracking-[0.18em] text-[#b3a5a2]";

function Seg<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map(([v, text]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`rounded-md px-2.5 py-1.5 text-[11px] font-bold transition ${
            value === v ? "bg-[#f5c84c] text-black" : "bg-white/5 text-[#f4efe9] hover:bg-white/10"
          }`}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

function Color({ value, onChange, title }: { value: string; onChange: (v: string) => void; title: string }) {
  return (
    <label className="flex items-center gap-2 text-xs">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-10 cursor-pointer rounded border border-[#3a2a2d] bg-transparent"
        title={title}
      />
      <span className="font-mono text-[#b3a5a2]">{value}</span>
    </label>
  );
}

/* ---------- image picker ---------- */

function ImagePicker({
  title,
  max,
  current,
  onSave,
  onClose,
}: {
  title: string;
  max: number;
  current: string[];
  onSave: (urls: string[] | null) => void;
  onClose: () => void;
}) {
  const [library, setLibrary] = useState<LibraryImage[] | null>(null);
  const [chosen, setChosen] = useState<string[]>(current);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/admin/media-library")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { images: LibraryImage[] }) => setLibrary(d.images))
      .catch(() => setError("Couldn't load your images."));
  }, []);
  const toggle = (url: string) =>
    setChosen((c) => (c.includes(url) ? c.filter((u) => u !== url) : c.length < max ? [...c, url] : c));

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className={`${panel} flex max-h-[88vh] w-full max-w-4xl flex-col`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#3a2a2d] p-4">
          <div>
            <p className="text-sm font-bold">{title}</p>
            <p className="text-xs text-[#b3a5a2]">
              Click photos in the order you want them · {chosen.length}/{max} chosen
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full px-3 py-1 text-sm hover:bg-white/10">
            ✕
          </button>
        </div>
        <div className="grid flex-1 grid-cols-3 gap-3 overflow-auto p-4 sm:grid-cols-5">
          {error && <p className="col-span-full text-sm text-[#ff8a8a]">{error}</p>}
          {!library && !error && <p className="col-span-full text-sm text-[#b3a5a2]">Loading…</p>}
          {library?.map((img) => {
            const n = chosen.indexOf(img.url);
            return (
              <button
                key={img.url}
                type="button"
                onClick={() => toggle(img.url)}
                className={`group relative overflow-hidden rounded-lg border-2 ${n >= 0 ? "border-[#f5c84c]" : "border-transparent hover:border-white/30"}`}
                title={img.title}
              >
                <img src={img.url} alt={img.title} loading="lazy" className="aspect-square w-full object-cover" />
                {n >= 0 && (
                  <span className="absolute left-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#f5c84c] text-xs font-black text-black">
                    {n + 1}
                  </span>
                )}
                <span className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-1.5 py-0.5 text-left text-[10px]">
                  {img.source === "portfolio" ? "Portfolio · " : ""}
                  {img.title}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#3a2a2d] p-4">
          <button type="button" onClick={() => onSave(null)} className="rounded-full px-4 py-2 text-xs font-bold hover:bg-white/10">
            Use the default photos
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={() => setChosen([])} className="rounded-full px-4 py-2 text-xs font-bold hover:bg-white/10">
              Clear
            </button>
            <button
              type="button"
              disabled={chosen.length === 0}
              onClick={() => onSave(chosen)}
              className="rounded-full bg-[#f5c84c] px-5 py-2 text-xs font-bold text-black disabled:opacity-40"
            >
              Use these photos
            </button>
          </div>
        </div>
        <p className="px-4 pb-3 text-[11px] text-[#b3a5a2]">
          To add new photos, upload them in Admin → Portfolio; they appear here automatically, resized for speed.
        </p>
      </div>
    </div>
  );
}

/* ---------- the editor ---------- */

export function SiteEditor({ initial, published, slots }: { initial: HomeLayout; published: HomeLayout; slots: Slots }) {
  const [layout, setLayout] = useState(initial);
  const [past, setPast] = useState<HomeLayout[]>([]);
  const [future, setFuture] = useState<HomeLayout[]>([]);
  const [liveJson, setLiveJson] = useState(JSON.stringify(published));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [moveMode, setMoveMode] = useState(false);
  const [tab, setTab] = useState<"section" | "site" | "versions">("section");
  const [showLayers, setShowLayers] = useState(true);
  const [showPanel, setShowPanel] = useState(true);
  const [device, setDevice] = useState<"desktop" | "tablet" | "phone">("desktop");
  const [status, setStatus] = useState("All changes saved as draft");
  const [picker, setPicker] = useState<{ sectionId: string; slot: string } | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [adding, setAdding] = useState(false);
  const dragIndex = useRef<number | null>(null);
  const firstRender = useRef(true);
  const unpublished = JSON.stringify(layout) !== liveJson;

  const commit = useCallback((fn: (l: HomeLayout) => HomeLayout) => {
    setLayout((prev) => {
      const next = fn(prev);
      if (next === prev) return prev;
      setPast((p) => [...p.slice(-79), prev]);
      setFuture([]);
      return next;
    });
  }, []);

  const updateSection = useCallback(
    (id: string, fn: (s: Section) => Section) =>
      commit((l) => ({ ...l, sections: l.sections.map((s) => (s.id === id ? fn(s) : s)) })),
    [commit]
  );

  const undo = useCallback(() => {
    setPast((p) => {
      if (!p.length) return p;
      const prev = p[p.length - 1];
      setLayout((cur) => {
        setFuture((f) => [cur, ...f]);
        return prev;
      });
      return p.slice(0, -1);
    });
  }, []);
  const redo = useCallback(() => {
    setFuture((f) => {
      if (!f.length) return f;
      const next = f[0];
      setLayout((cur) => {
        setPast((p) => [...p, cur]);
        return next;
      });
      return f.slice(1);
    });
  }, []);

  // Autosave the draft (never touches the live site) + share it with the device preview.
  const saveDraft = useCallback(async (l: HomeLayout) => {
    setStatus("Saving draft…");
    const res = await fetch("/api/admin/homepage-layout", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ layout: l }),
    }).catch(() => null);
    setStatus(res?.ok ? "Draft saved" : "⚠ Draft not saved — check your connection");
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(layout));
    } catch {}
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const t = setTimeout(() => saveDraft(layout), 1200);
    return () => clearTimeout(t);
  }, [layout, saveDraft]);

  const loadHistory = useCallback(async () => {
    const res = await fetch("/api/admin/homepage-layout").catch(() => null);
    if (res?.ok) setHistory(((await res.json()) as { history: HistoryRow[] }).history);
  }, []);

  // Keyboard shortcuts (text fields keep their own undo).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName);
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveDraft(layout);
        return;
      }
      if (typing) return;
      if (mod && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (mod && (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
      } else if (e.key === "m" && !mod) {
        setMoveMode((m) => !m);
      } else if (e.key === "Escape") {
        setMoveMode(false);
        setSelectedId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [layout, saveDraft, undo, redo]);

  // Warn before leaving with unpublished work.
  useEffect(() => {
    if (!unpublished) return;
    const onLeave = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [unpublished]);

  const editApi = useMemo(
    () => ({
      editing: true,
      moveMode,
      setText: (sectionId: string, key: string, value: string) =>
        updateSection(sectionId, (s) => ({ ...s, text: { ...s.text, [key]: value } })),
      setPlace: (sectionId: string, elId: string, place: Placement | null) =>
        updateSection(sectionId, (s) => {
          const nextPlace = { ...(s.place ?? {}) };
          if (place) nextPlace[elId] = place;
          else delete nextPlace[elId];
          return { ...s, place: Object.keys(nextPlace).length ? nextPlace : undefined };
        }),
    }),
    [moveMode, updateSection]
  );

  /* ----- section actions ----- */
  const select = (id: string) => {
    setSelectedId(id);
    setTab("section");
    setShowPanel(true);
  };
  const scrollTo = (id: string) => document.getElementById(`sec-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  const addSection = (type: SectionType) => {
    const id = SECTION_LIBRARY[type].single ? type : newId(type);
    const at = selectedId ? layout.sections.findIndex((s) => s.id === selectedId) + 1 : layout.sections.length;
    commit((l) => {
      const next = [...l.sections];
      next.splice(at, 0, { id, type, text: {} });
      return { ...l, sections: next };
    });
    setAdding(false);
    select(id);
    setTimeout(() => scrollTo(id), 150);
  };
  const duplicate = (id: string) => {
    const src = layout.sections.find((s) => s.id === id);
    if (!src || SECTION_LIBRARY[src.type].single) return;
    const copy: Section = { ...structuredClone(src), id: newId(src.type) };
    commit((l) => {
      const i = l.sections.findIndex((s) => s.id === id);
      const next = [...l.sections];
      next.splice(i + 1, 0, copy);
      return { ...l, sections: next };
    });
    select(copy.id);
  };
  const remove = (id: string) => {
    const s = layout.sections.find((x) => x.id === id);
    if (!s || !confirm(`Delete the "${SECTION_LIBRARY[s.type].label}" section? (Undo brings it back.)`)) return;
    commit((l) => ({ ...l, sections: l.sections.filter((x) => x.id !== id) }));
    if (selectedId === id) setSelectedId(null);
  };
  const moveTo = (from: number, to: number) =>
    commit((l) => {
      if (from === to || from < 0 || to < 0 || to >= l.sections.length) return l;
      const next = [...l.sections];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return { ...l, sections: next };
    });
  const setStyle = (id: string, patch: Partial<SectionStyle>) =>
    updateSection(id, (s) => ({ ...s, style: { ...(s.style ?? {}), ...patch } }));
  const setTheme = (t: Theme | undefined) => commit((l) => ({ ...l, theme: t }));

  async function publish() {
    if (!confirm("Publish these changes to the live website?")) return;
    setStatus("Publishing…");
    const res = await fetch("/api/admin/homepage-layout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "publish", layout }),
    }).catch(() => null);
    if (res?.ok) {
      setLiveJson(JSON.stringify(layout));
      setStatus("✓ Published — live now");
      loadHistory();
    } else {
      setStatus("⚠ Publish failed");
    }
  }
  async function restore(index: number) {
    if (!confirm("Load this earlier version into the editor? (The live site doesn't change until you publish.)")) return;
    const res = await fetch("/api/admin/homepage-layout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "restore", index }),
    }).catch(() => null);
    if (res?.ok) {
      const { layout: l } = (await res.json()) as { layout: HomeLayout };
      commit(() => l);
      setStatus("Earlier version loaded — publish to make it live");
    }
  }
  async function resetDesign() {
    if (!confirm("Start over from the original design? (The live site doesn't change until you publish.)")) return;
    const res = await fetch("/api/admin/homepage-layout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset" }),
    }).catch(() => null);
    if (res?.ok) {
      const { layout: l } = (await res.json()) as { layout: HomeLayout };
      commit(() => l);
    }
  }

  const selected = layout.sections.find((s) => s.id === selectedId) ?? null;
  const selectedStyle = selected ? styleOf(selected) : null;
  const imageCount = layout.sections
    .filter((s) => !s.hidden)
    .reduce((n, s) => n + Object.keys(SECTION_LIBRARY[s.type].slots ?? {}).reduce((m, slot) => m + imagesOf(s, slot).length, 0), 0);
  const present = new Set(layout.sections.map((s) => s.type));
  const btn = "rounded-full px-3 py-2 text-[11px] font-bold uppercase tracking-[0.1em] transition disabled:opacity-30";

  return (
    <>
      <div
        className="transition-[padding] duration-300"
        style={{ paddingLeft: showLayers ? "var(--ed-left)" : 0, paddingRight: showPanel ? "var(--ed-right)" : 0 }}
      >
        <style>{`@media (min-width: 1280px){:root{--ed-left:17rem;--ed-right:19.5rem}}`}</style>
        <EditProvider value={editApi}>
          <HomeSections layout={layout} slots={slots} canvas={{ selectedId, select }} />
        </EditProvider>
      </div>

      {/* ----- Layers ----- */}
      {showLayers && (
        <aside className={`${panel} fixed bottom-24 left-3 top-20 z-[90] flex w-64 flex-col`} data-mode="dark">
          <div className="flex items-center justify-between border-b border-[#3a2a2d] p-3">
            <p className={label}>Sections · drag to reorder</p>
            <button type="button" className="text-xs text-[#b3a5a2] hover:text-white" onClick={() => setShowLayers(false)}>
              Hide
            </button>
          </div>
          <ol className="flex-1 space-y-1 overflow-auto p-2">
            {layout.sections.map((s, i) => (
              <li
                key={s.id}
                draggable
                onDragStart={() => (dragIndex.current = i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragIndex.current !== null) moveTo(dragIndex.current, i);
                  dragIndex.current = null;
                }}
                onClick={() => {
                  select(s.id);
                  scrollTo(s.id);
                }}
                className={`group flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm ${
                  selectedId === s.id ? "bg-[#f5c84c] text-black" : "hover:bg-white/5"
                } ${s.hidden ? "opacity-50" : ""}`}
              >
                <span className="cursor-grab select-none text-xs opacity-50">⋮⋮</span>
                <span className="flex-1 truncate font-bold">{SECTION_LIBRARY[s.type].label}</span>
                <button
                  type="button"
                  title={s.hidden ? "Show on site" : "Hide from site"}
                  className="text-xs opacity-60 hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    updateSection(s.id, (x) => ({ ...x, hidden: !x.hidden }));
                  }}
                >
                  {s.hidden ? "◌" : "◉"}
                </button>
              </li>
            ))}
          </ol>
          <div className="border-t border-[#3a2a2d] p-2">
            {adding ? (
              <div className="max-h-72 space-y-1 overflow-auto">
                {(Object.keys(SECTION_LIBRARY) as SectionType[])
                  .filter((t) => !(SECTION_LIBRARY[t].single && present.has(t)))
                  .map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => addSection(t)}
                      className="block w-full rounded-lg p-2 text-left hover:bg-white/5"
                    >
                      <span className="block text-sm font-bold">{SECTION_LIBRARY[t].label}</span>
                      <span className="block text-[11px] text-[#b3a5a2]">{SECTION_LIBRARY[t].description}</span>
                    </button>
                  ))}
                <button type="button" onClick={() => setAdding(false)} className="w-full p-2 text-xs text-[#b3a5a2]">
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="w-full rounded-lg border border-dashed border-[#f5c84c]/60 p-2 text-xs font-bold uppercase tracking-[0.12em] text-[#f5c84c] hover:bg-[#f5c84c] hover:text-black"
              >
                + Add section {selectedId ? "below selected" : ""}
              </button>
            )}
          </div>
        </aside>
      )}

      {/* ----- Inspector ----- */}
      {showPanel && (
        <aside className={`${panel} fixed bottom-24 right-3 top-20 z-[90] flex w-[18.5rem] flex-col`} data-mode="dark">
          <div className="flex border-b border-[#3a2a2d] p-1.5">
            {(
              [
                ["section", "Section"],
                ["site", "Site look"],
                ["versions", "Versions"],
              ] as const
            ).map(([k, text]) => (
              <button
                key={k}
                type="button"
                onClick={() => {
                  setTab(k);
                  if (k === "versions") loadHistory();
                }}
                className={`flex-1 rounded-lg py-2 text-[11px] font-bold uppercase tracking-[0.12em] ${tab === k ? "bg-white/10" : "text-[#b3a5a2] hover:text-white"}`}
              >
                {text}
              </button>
            ))}
            <button type="button" className="px-2 text-xs text-[#b3a5a2] hover:text-white" onClick={() => setShowPanel(false)} title="Hide panel">
              ✕
            </button>
          </div>

          <div className="flex-1 space-y-5 overflow-auto p-4">
            {tab === "section" && !selected && (
              <p className="text-sm text-[#b3a5a2]">Click any section on the page (or in the list) to style it. Click words to edit them.</p>
            )}

            {tab === "section" && selected && selectedStyle && (
              <>
                <div>
                  <p className="text-base font-black">{SECTION_LIBRARY[selected.type].label}</p>
                  <p className="text-xs text-[#b3a5a2]">{SECTION_LIBRARY[selected.type].description}</p>
                </div>

                <div className="space-y-2">
                  <p className={label}>Background</p>
                  <Seg<Background>
                    value={selectedStyle.bg ?? "page"}
                    options={[
                      ["page", "Page"],
                      ["light", "Light"],
                      ["dark", "Dark"],
                      ["color", "Colour"],
                      ["gradient", "Gradient"],
                    ]}
                    onChange={(bg) => setStyle(selected.id, { bg })}
                  />
                  {selectedStyle.bg === "color" && (
                    <Color title="Background colour" value={selectedStyle.color1 ?? "#8e1b3a"} onChange={(c) => setStyle(selected.id, { color1: c })} />
                  )}
                  {selectedStyle.bg === "gradient" && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-6 gap-1.5">
                        {GRADIENTS.map(([a, b, ang]) => (
                          <button
                            key={a + b}
                            type="button"
                            title="Use this gradient"
                            onClick={() => setStyle(selected.id, { color1: a, color2: b, angle: ang })}
                            className="h-8 rounded-md ring-1 ring-white/10 hover:ring-[#f5c84c]"
                            style={{ background: `linear-gradient(${ang}deg, ${a}, ${b})` }}
                          />
                        ))}
                      </div>
                      <div className="flex gap-3">
                        <Color title="Start colour" value={selectedStyle.color1 ?? "#8e1b3a"} onChange={(c) => setStyle(selected.id, { color1: c })} />
                        <Color title="End colour" value={selectedStyle.color2 ?? "#160b0d"} onChange={(c) => setStyle(selected.id, { color2: c })} />
                      </div>
                      <label className="block text-xs text-[#b3a5a2]">
                        Direction {selectedStyle.angle ?? 160}°
                        <input
                          type="range"
                          min={0}
                          max={360}
                          value={selectedStyle.angle ?? 160}
                          onChange={(e) => setStyle(selected.id, { angle: Number(e.target.value) })}
                          className="mt-1 w-full accent-[#f5c84c]"
                        />
                      </label>
                    </div>
                  )}
                  {selectedStyle.bg && selectedStyle.bg !== "page" && (
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={!!selectedStyle.grain}
                        onChange={(e) => setStyle(selected.id, { grain: e.target.checked })}
                        className="accent-[#f5c84c]"
                      />
                      Film grain texture
                    </label>
                  )}
                </div>

                <div className="space-y-2">
                  <p className={label}>Section height</p>
                  <Seg<Height>
                    value={selectedStyle.height ?? "normal"}
                    options={[
                      ["tight", "Shorter"],
                      ["normal", "Normal"],
                      ["roomy", "Taller"],
                      ["screen", "Full screen"],
                    ]}
                    onChange={(height) => setStyle(selected.id, { height })}
                  />
                </div>

                <div className="space-y-2">
                  <p className={label}>Entrance animation</p>
                  <Seg<Entrance>
                    value={selectedStyle.entrance ?? "rise"}
                    options={[
                      ["rise", "Rise"],
                      ["fade", "Fade"],
                      ["zoom", "Zoom"],
                      ["slide", "Slide"],
                      ["none", "None"],
                    ]}
                    onChange={(entrance) => setStyle(selected.id, { entrance })}
                  />
                </div>

                <div className="space-y-2">
                  <p className={label}>Image hover effect</p>
                  <Seg<Hover>
                    value={selectedStyle.hover ?? "none"}
                    options={[
                      ["none", "None"],
                      ["zoom", "Zoom"],
                      ["tilt", "Tilt"],
                      ["lift", "Lift"],
                    ]}
                    onChange={(hover) => setStyle(selected.id, { hover })}
                  />
                </div>

                {SECTION_LIBRARY[selected.type].slots && (
                  <div className="space-y-3">
                    <p className={label}>Images</p>
                    {Object.entries(SECTION_LIBRARY[selected.type].slots!).map(([slot, def]) => {
                      const imgs = imagesOf(selected, slot);
                      return (
                        <div key={slot} className="rounded-lg bg-white/5 p-2.5">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-bold">{def.label}</span>
                            <button
                              type="button"
                              onClick={() => setPicker({ sectionId: selected.id, slot })}
                              className="rounded-full bg-[#f5c84c] px-3 py-1 text-[10px] font-bold uppercase text-black"
                            >
                              Choose
                            </button>
                          </div>
                          <div className="flex gap-1 overflow-hidden">
                            {imgs.slice(0, 6).map((u, i) => (
                              <img key={u + i} src={u} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
                            ))}
                            {imgs.length > 6 && <span className="self-center text-[10px] text-[#b3a5a2]">+{imgs.length - 6}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="space-y-2">
                  <p className={label}>Position & size</p>
                  <p className="text-xs text-[#b3a5a2]">
                    Turn on <b>Move &amp; resize</b> (or press M), then drag pieces and pull the corner to resize. Applies on
                    tablets and computers; phones keep the tidy stacked layout.
                  </p>
                  {selected.place && (
                    <button
                      type="button"
                      onClick={() => updateSection(selected.id, (s) => ({ ...s, place: undefined }))}
                      className="rounded-full bg-white/5 px-3 py-1.5 text-[11px] font-bold hover:bg-white/10"
                    >
                      Reset {Object.keys(selected.place).length} moved piece(s)
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 border-t border-[#3a2a2d] pt-4">
                  <button
                    type="button"
                    onClick={() => updateSection(selected.id, (s) => ({ ...s, hidden: !s.hidden }))}
                    className="rounded-full bg-white/5 px-3 py-1.5 text-[11px] font-bold hover:bg-white/10"
                  >
                    {selected.hidden ? "Show on site" : "Hide from site"}
                  </button>
                  {!SECTION_LIBRARY[selected.type].single && (
                    <button type="button" onClick={() => duplicate(selected.id)} className="rounded-full bg-white/5 px-3 py-1.5 text-[11px] font-bold hover:bg-white/10">
                      Duplicate
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => updateSection(selected.id, (s) => ({ ...s, style: undefined }))}
                    className="rounded-full bg-white/5 px-3 py-1.5 text-[11px] font-bold hover:bg-white/10"
                  >
                    Reset style
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(selected.id)}
                    className="rounded-full bg-[#8e1b3a] px-3 py-1.5 text-[11px] font-bold hover:brightness-110"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}

            {tab === "site" && (
              <>
                <div className="space-y-2">
                  <p className={label}>Colour presets</p>
                  <div className="grid grid-cols-2 gap-2">
                    {THEME_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() =>
                          setTheme(p.id === "velvet" ? undefined : { preset: p.id, accent: p.accent, accentBright: p.accentBright, spark: p.spark })
                        }
                        className={`rounded-lg p-2 text-left ring-1 ${
                          (layout.theme?.preset ?? "velvet") === p.id ? "ring-[#f5c84c]" : "ring-white/10 hover:ring-white/30"
                        }`}
                      >
                        <span className="flex gap-1">
                          {[p.accent, p.accentBright, p.spark].map((c) => (
                            <span key={c} className="h-5 w-5 rounded-full" style={{ background: c }} />
                          ))}
                        </span>
                        <span className="mt-1.5 block text-xs font-bold">{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className={label}>Custom colours</p>
                  <Color
                    title="Main accent"
                    value={layout.theme?.accent ?? "#8e1b3a"}
                    onChange={(c) => setTheme({ ...(layout.theme ?? {}), preset: "custom", accent: c })}
                  />
                  <Color
                    title="Bright accent"
                    value={layout.theme?.accentBright ?? "#c23a5c"}
                    onChange={(c) => setTheme({ ...(layout.theme ?? {}), preset: "custom", accentBright: c })}
                  />
                  <Color
                    title="Spark (buttons, highlights)"
                    value={layout.theme?.spark ?? "#f5c84c"}
                    onChange={(c) => setTheme({ ...(layout.theme ?? {}), preset: "custom", spark: c })}
                  />
                  <p className="text-[11px] text-[#b3a5a2]">Main accent · Bright accent · Spark (buttons & highlights)</p>
                </div>
                <div className="rounded-lg bg-white/5 p-3 text-xs text-[#b3a5a2]">
                  <p className="font-bold text-[#f4efe9]">Page check</p>
                  <p className="mt-1">
                    {layout.sections.filter((s) => !s.hidden).length} sections visible · {imageCount} photos on the page
                    {imageCount > 40 ? " — that's a lot; consider fewer for speed." : " — good for speed."}
                  </p>
                </div>
              </>
            )}

            {tab === "versions" && (
              <>
                <p className="text-xs text-[#b3a5a2]">
                  Every time you publish, the previous live version is kept here. Loading one puts it in the editor; nothing changes on
                  the live site until you publish.
                </p>
                <ul className="space-y-2">
                  {history.length === 0 && <li className="text-sm text-[#b3a5a2]">No earlier versions yet.</li>}
                  {history.map((h) => (
                    <li key={h.index} className="flex items-center justify-between rounded-lg bg-white/5 p-2.5 text-xs">
                      <span>
                        {new Date(h.at).toLocaleString()} · {h.sections} sections
                      </span>
                      <button type="button" onClick={() => restore(h.index)} className="rounded-full bg-white/10 px-3 py-1 font-bold hover:bg-white/20">
                        Load
                      </button>
                    </li>
                  ))}
                </ul>
                <button type="button" onClick={resetDesign} className="rounded-full bg-white/5 px-3 py-1.5 text-[11px] font-bold hover:bg-white/10">
                  Start over from the original design
                </button>
              </>
            )}
          </div>
        </aside>
      )}

      {/* ----- Device preview ----- */}
      {device !== "desktop" && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/60 p-4" onClick={() => setDevice("desktop")} data-mode="dark">
          <div onClick={(e) => e.stopPropagation()} className="flex max-h-full flex-col items-center gap-3">
            <div
              className="overflow-hidden rounded-[2.2rem] border-[10px] border-[#050304] bg-[#050304] shadow-2xl"
              style={{ width: device === "phone" ? 390 : 834, height: "min(84vh, 1100px)", maxWidth: "92vw" }}
            >
              <iframe title={`${device} preview`} src="/admin/dashboard/site/frame" className="h-full w-full bg-white" />
            </div>
            <p className="text-xs text-white/70">Showing your draft · click outside to close</p>
          </div>
        </div>
      )}

      {/* ----- Image picker ----- */}
      {picker &&
        (() => {
          const s = layout.sections.find((x) => x.id === picker.sectionId);
          const def = s && SECTION_LIBRARY[s.type].slots?.[picker.slot];
          if (!s || !def) return null;
          return (
            <ImagePicker
              title={`${SECTION_LIBRARY[s.type].label} · ${def.label}`}
              max={def.max}
              current={s.images?.[picker.slot] ?? []}
              onClose={() => setPicker(null)}
              onSave={(urls) => {
                updateSection(s.id, (x) => {
                  const images = { ...(x.images ?? {}) };
                  if (urls && urls.length) images[picker.slot] = urls;
                  else delete images[picker.slot];
                  return { ...x, images: Object.keys(images).length ? images : undefined };
                });
                setPicker(null);
              }}
            />
          );
        })()}

      {/* ----- Toolbar ----- */}
      <div className="fixed inset-x-0 bottom-3 z-[96] flex justify-center px-3" data-mode="dark">
        <div className={`${panel} flex max-w-full flex-wrap items-center justify-center gap-1 rounded-2xl p-1.5 sm:rounded-full`}>
          <button type="button" className={`${btn} hover:bg-white/10`} onClick={() => setShowLayers((v) => !v)} title="Sections list">
            ☰ Sections
          </button>
          <button type="button" className={`${btn} hover:bg-white/10`} disabled={!past.length} onClick={undo} title="Undo (Ctrl+Z)">
            ↶
          </button>
          <button type="button" className={`${btn} hover:bg-white/10`} disabled={!future.length} onClick={redo} title="Redo (Ctrl+Shift+Z)">
            ↷
          </button>
          <button
            type="button"
            className={`${btn} ${moveMode ? "bg-[#f5c84c] text-black" : "hover:bg-white/10"}`}
            onClick={() => setMoveMode((m) => !m)}
            title="Move & resize (M)"
          >
            ✥ Move &amp; resize
          </button>
          <span className="mx-1 hidden h-5 w-px bg-white/15 sm:block" />
          {(
            [
              ["desktop", "🖥"],
              ["tablet", "▭"],
              ["phone", "📱"],
            ] as const
          ).map(([d, icon]) => (
            <button
              key={d}
              type="button"
              className={`${btn} ${device === d ? "bg-white/15" : "hover:bg-white/10"}`}
              onClick={() => setDevice(d)}
              title={`${d[0].toUpperCase()}${d.slice(1)} view`}
            >
              {icon}
            </button>
          ))}
          <span className="mx-1 hidden h-5 w-px bg-white/15 sm:block" />
          <span className="px-2 text-[11px] text-[#b3a5a2]">{unpublished ? `● ${status} · not live yet` : status}</span>
          <button type="button" className={`${btn} hover:bg-white/10`} onClick={() => setShowPanel((v) => !v)}>
            ⚙ Panel
          </button>
          <Link href="/" target="_blank" className={`${btn} hover:bg-white/10`}>
            Live ↗
          </Link>
          <button
            type="button"
            className={`${btn} bg-[#f5c84c] px-4 text-black hover:bg-[#8e1b3a] hover:text-white`}
            disabled={!unpublished}
            onClick={publish}
          >
            Publish
          </button>
        </div>
      </div>
    </>
  );
}
