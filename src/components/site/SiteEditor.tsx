"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EditProvider, textOf, type Sel, type TextSel } from "./Editable";
import { PHOTOS } from "@/components/cinema/photos";
import { HomeSections, type Slots } from "./HomeSections";
import {
  SECTION_LIBRARY,
  THEME_PRESETS,
  imagesOf,
  showOrderOf,
  styleOf,
  type Background,
  type Entrance,
  type El,
  type Height,
  type HomeLayout,
  type Hover,
  type Placement,
  type TextFmt,
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
              onClick={() => onSave(chosen)}
              className="rounded-full bg-[#f5c84c] px-5 py-2 text-xs font-bold text-black"
            >
              {chosen.length ? "Use these photos" : "Leave this spot empty"}
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

/* ---------- text format bar ---------- */

/** Floating bar above the text being edited: its own colour, font, size, weight. */
function TextFormatBar({
  target,
  fmt,
  onChange,
  onReset,
}: {
  target: NonNullable<TextSel>;
  fmt: TextFmt | undefined;
  onChange: (patch: Partial<TextFmt>) => void;
  onReset: () => void;
}) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [liveColor, setLiveColor] = useState<string | null>(null);
  useEffect(() => {
    const place = () => {
      const node = document.querySelector<HTMLElement>(`[data-txt="${target.sectionId}:${target.key}"]`);
      if (!node) return setPos(null);
      const r = node.getBoundingClientRect();
      setPos({ x: Math.max(8, Math.min(window.innerWidth - 470, r.left)), y: Math.max(64, r.top - 54) });
    };
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    const id = setInterval(place, 400);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
      clearInterval(id);
    };
  }, [target.sectionId, target.key]);
  if (!pos) return null;
  const b = (on: boolean) => `rounded-md px-2 py-1.5 text-[11px] font-bold ${on ? "bg-[#f5c84c] text-black" : "hover:bg-white/10"}`;
  return (
    <div
      data-mode="dark"
      className="fixed z-[98] flex items-center gap-1 rounded-xl border border-[#3a2a2d] bg-[#120c0e] p-1.5 text-[#f4efe9] shadow-2xl"
      style={{ left: pos.x, top: pos.y }}
      onMouseDown={(e) => {
        // keep the text selected while using the bar (but let the colour picker open)
        if ((e.target as HTMLElement).tagName !== "INPUT") e.preventDefault();
      }}
    >
      <label className="flex cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-1 hover:bg-white/10" title="Text colour">
        <span className="h-5 w-5 rounded-full ring-1 ring-white/30" style={{ background: liveColor ?? fmt?.color ?? "#f4efe9" }} />
        <span className="text-[11px] font-bold">Colour</span>
        <input
          type="color"
          value={liveColor ?? fmt?.color ?? "#1a0f10"}
          // Saved as you pick (quick changes merge into one undo step), so the
          // colour sticks even if the picker is closed by clicking elsewhere.
          onChange={(e) => {
            setLiveColor(e.target.value);
            onChange({ color: e.target.value });
          }}
          onBlur={() => setLiveColor(null)}
          className="sr-only"
        />
      </label>
      <span className="h-4 w-px bg-white/15" />
      {(
        [
          ["display", "Bold"],
          ["sans", "Clean"],
          ["script", "Script"],
        ] as const
      ).map(([k, t]) => (
        <button key={k} type="button" className={b(fmt?.font === k)} onClick={() => onChange({ font: fmt?.font === k ? undefined : k })}>
          {t}
        </button>
      ))}
      <span className="h-4 w-px bg-white/15" />
      <button type="button" className={b(fmt?.weight === 900)} onClick={() => onChange({ weight: fmt?.weight === 900 ? undefined : 900 })} title="Extra bold">
        B
      </button>
      <button type="button" className={b(!!fmt?.italic)} onClick={() => onChange({ italic: !fmt?.italic || undefined })} title="Italic">
        <i>I</i>
      </button>
      <span className="h-4 w-px bg-white/15" />
      <button type="button" className={b(false)} onClick={() => onChange({ size: Math.max(0.4, Math.round(((fmt?.size ?? 1) - 0.1) * 10) / 10) })} title="Smaller">
        A−
      </button>
      <span className="w-9 text-center text-[11px] tabular-nums text-[#b3a5a2]">{Math.round((fmt?.size ?? 1) * 100)}%</span>
      <button type="button" className={b(false)} onClick={() => onChange({ size: Math.min(3, Math.round(((fmt?.size ?? 1) + 0.1) * 10) / 10) })} title="Bigger">
        A+
      </button>
      <span className="h-4 w-px bg-white/15" />
      <button type="button" className={b(false)} onClick={onReset} title="Back to the design's look">
        Reset
      </button>
    </div>
  );
}

/* ---------- element helpers ---------- */

const rgbToHex = (rgb: string) => {
  const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/.exec(rgb);
  if (!m || (m[4] !== undefined && parseFloat(m[4]) < 0.2)) return undefined;
  return "#" + [m[1], m[2], m[3]].map((n) => Number(n).toString(16).padStart(2, "0")).join("");
};

/** Reads a built-in piece off the page (its words or photo, and its look) so
 * it can be pasted as a free element that keeps the same style. */
function elementFromDom(sectionId: string, id: string): Omit<El, "id"> | null {
  const node = document.querySelector<HTMLElement>(`[data-el="${sectionId}:${id}"]`);
  const sec = document.querySelector<HTMLElement>(`[data-sec="${sectionId}"]`);
  if (!node || !sec) return null;
  const secW = sec.offsetWidth || 1200;
  const r = node.getBoundingClientRect();
  const sr = sec.getBoundingClientRect();
  const base = {
    x: Math.max(0, Math.round(((r.left - sr.left) / secW) * 1000) / 10),
    y: Math.max(0, Math.round(((r.top - sr.top) / secW) * 1000)),
    w: Math.min(100, Math.max(5, Math.round((r.width / secW) * 1000) / 10)),
    z: 10,
  };
  const text = node.innerText.trim();
  const img = node.querySelector("img");
  if (img && !text) {
    let src = img.getAttribute("src") ?? "";
    if (src.startsWith("/_next/image")) src = decodeURIComponent(new URLSearchParams(src.split("?")[1]).get("url") ?? "");
    if (!src) return null;
    return { ...base, kind: "image", src, h: Math.round((img.getBoundingClientRect().height / secW) * 1000), fit: "cover" };
  }
  if (!text) return null;
  const t = node.querySelector<HTMLElement>("h1,h2,h3,p,a,summary,span") ?? node;
  const cs = getComputedStyle(t);
  const fw = parseInt(cs.fontWeight, 10) || 400;
  return {
    ...base,
    kind: "text",
    text,
    size: Math.round((parseFloat(cs.fontSize) / secW) * 1000) / 10,
    weight: fw >= 800 ? 900 : fw >= 600 ? 700 : 400,
    color: rgbToHex(cs.color),
    font: /unbounded|display/i.test(cs.fontFamily) ? "display" : /caveat|script/i.test(cs.fontFamily) ? "script" : "sans",
    upper: cs.textTransform === "uppercase",
    align: cs.textAlign === "center" ? "center" : cs.textAlign === "right" || cs.textAlign === "end" ? "right" : "left",
  };
}

/** Small floating bar above the selected element: copy, duplicate, layers, delete. */
function ElementToolbar({
  sel,
  isCustom,
  hasClip,
  removed,
  onCopy,
  onPaste,
  onDuplicate,
  onFront,
  onBack,
  onDelete,
  onReplace,
  onReset,
  layoutKey,
}: {
  sel: NonNullable<Sel>;
  isCustom: boolean;
  hasClip: boolean;
  removed: boolean;
  onCopy: () => void;
  onPaste: () => void;
  onDuplicate: () => void;
  onFront: () => void;
  onBack: () => void;
  onDelete: () => void;
  onReplace?: () => void;
  onReset?: () => void;
  layoutKey: string;
}) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const place = () => {
      const node = document.querySelector<HTMLElement>(`[data-el="${sel.sectionId}:${sel.id}"]`);
      if (!node) return setPos(null);
      const r = node.getBoundingClientRect();
      setPos({
        x: Math.max(8, Math.min(window.innerWidth - 330, r.left + r.width / 2 - 150)),
        y: Math.max(64, r.top - 44),
      });
    };
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    const id = setInterval(place, 400); // catches drags and layout changes
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
      clearInterval(id);
    };
  }, [sel.sectionId, sel.id, layoutKey]);
  if (!pos || removed) return null;
  const b = "rounded-md px-2 py-1.5 text-[11px] font-bold hover:bg-white/10";
  return (
    <div
      data-mode="dark"
      className="fixed z-[97] flex items-center gap-0.5 rounded-xl border border-[#3a2a2d] bg-[#120c0e] p-1 text-[#f4efe9] shadow-2xl"
      style={{ left: pos.x, top: pos.y }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <button type="button" className={b} onClick={onCopy} title="Copy (Ctrl+C)">
        Copy
      </button>
      <button type="button" className={`${b} disabled:opacity-30`} onClick={onPaste} disabled={!hasClip} title="Paste (Ctrl+V)">
        Paste
      </button>
      {isCustom && (
        <button type="button" className={b} onClick={onDuplicate} title="Duplicate (Ctrl+D)">
          Duplicate
        </button>
      )}
      {onReplace && (
        <button type="button" className={`${b} text-[#f5c84c]`} onClick={onReplace} title="Replace this image">
          Replace
        </button>
      )}
      <span className="mx-0.5 h-4 w-px bg-white/15" />
      <button type="button" className={b} onClick={onFront} title="Bring in front of everything">
        ↑ Front
      </button>
      <button type="button" className={b} onClick={onBack} title="Send behind the section's content">
        ↓ Back
      </button>
      {onReset && (
        <button type="button" className={b} onClick={onReset} title="Put back where it was">
          ↺
        </button>
      )}
      <span className="mx-0.5 h-4 w-px bg-white/15" />
      <button type="button" className={`${b} text-[#ff8a8a]`} onClick={onDelete} title="Remove (Delete key)">
        {isCustom ? "Delete" : "Remove"}
      </button>
    </div>
  );
}

function newElId() {
  return `e${Math.random().toString(36).slice(2, 8)}`;
}

const ELEMENT_DEFAULTS: Record<"text" | "button" | "shape" | "signature", Omit<El, "id">> = {
  // The small spaced "Bruce & Elena" label (same size and colour as the section labels).
  signature: { kind: "text", x: 35, y: 30, w: 30, z: 10, text: "Bruce & Elena", size: 0.85, weight: 400, font: "sans", upper: true, track: 0.3, tone: "warm", align: "center" },
  text: { kind: "text", x: 12, y: 80, w: 40, z: 10, text: "New text — double-click to edit", size: 2.6, weight: 700, font: "display", upper: true },
  button: { kind: "button", x: 12, y: 80, w: 20, z: 10, text: "Click me", size: 1.2, weight: 700, font: "sans", radius: 999, href: "/#quote" },
  shape: { kind: "shape", x: 12, y: 80, w: 24, h: 120, z: 2, fill: "#8e1b3a", radius: 16, opacity: 0.9 },
};

/* ---------- the editor ---------- */

export function SiteEditor({ initial, published, slots }: { initial: HomeLayout; published: HomeLayout; slots: Slots }) {
  const [layout, setLayout] = useState(initial);
  const [past, setPast] = useState<HomeLayout[]>([]);
  const [future, setFuture] = useState<HomeLayout[]>([]);
  const [liveJson, setLiveJson] = useState(JSON.stringify(published));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [moveMode, setMoveMode] = useState(false);
  const [tab, setTab] = useState<"section" | "element" | "site" | "versions">("section");
  const [sel, setSel] = useState<Sel>(null);
  const [textSel, setTextSel] = useState<TextSel>(null);
  const [clip, setClip] = useState<Omit<El, "id"> | null>(null);
  const [addingEl, setAddingEl] = useState(false);
  const [showLayers, setShowLayers] = useState(true);
  const [showPanel, setShowPanel] = useState(true);
  const [device, setDevice] = useState<"desktop" | "tablet" | "phone">("desktop");
  const [status, setStatus] = useState("All changes saved as draft");
  const [picker, setPicker] = useState<
    { mode: "slot"; sectionId: string; slot: string } | { mode: "new"; sectionId: string } | { mode: "replace"; sectionId: string; id: string } | null
  >(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [adding, setAdding] = useState(false);
  const dragIndex = useRef<number | null>(null);
  const firstRender = useRef(true);
  const unpublished = JSON.stringify(layout) !== liveJson;

  // Changes less than half a second apart (a drag, a slider) count as one undo step.
  const lastCommit = useRef(0);
  const commit = useCallback((fn: (l: HomeLayout) => HomeLayout) => {
    setLayout((prev) => {
      const next = fn(prev);
      if (next === prev) return prev;
      const now = Date.now();
      if (now - lastCommit.current > 500) setPast((p) => [...p.slice(-79), prev]);
      lastCommit.current = now;
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

  /* ----- elements: add, copy, paste, duplicate, layers, delete ----- */
  const targetSectionId = () => sel?.sectionId ?? selectedId ?? layout.sections.find((s) => !s.hidden)?.id ?? null;
  const findEl = (sectionId: string, id: string) => layout.sections.find((s) => s.id === sectionId)?.els?.find((e) => e.id === id);

  const addEl = (sectionId: string, partial: Omit<El, "id">) => {
    const id = newElId();
    updateSection(sectionId, (s) => ({ ...s, els: [...(s.els ?? []), { ...partial, id }] }));
    setSelectedId(sectionId);
    setSel({ sectionId, id, builtin: false });
    setTab("element");
    setShowPanel(true);
    setAddingEl(false);
  };
  const addElement = (kind: "text" | "button" | "shape" | "image" | "signature") => {
    const sectionId = targetSectionId();
    if (!sectionId) return;
    if (kind === "image") setPicker({ mode: "new", sectionId });
    else addEl(sectionId, ELEMENT_DEFAULTS[kind]);
  };
  const updateEl = useCallback(
    (sectionId: string, id: string, patch: Partial<El>) =>
      updateSection(sectionId, (s) => ({ ...s, els: (s.els ?? []).map((e) => (e.id === id ? { ...e, ...patch } : e)) })),
    [updateSection]
  );
  const copySel = () => {
    if (!sel) return;
    if (sel.builtin) {
      const el = elementFromDom(sel.sectionId, sel.id);
      if (el) {
        setClip(el);
        setStatus("Copied — press Ctrl+V or Paste to place a copy");
      } else setStatus("That piece can't be copied");
    } else {
      const el = findEl(sel.sectionId, sel.id);
      if (el) {
        const { id: _id, ...rest } = el;
        void _id;
        setClip(rest);
        setStatus("Copied — press Ctrl+V or Paste to place a copy");
      }
    }
  };
  const pasteEl = () => {
    const sectionId = targetSectionId();
    if (!clip || !sectionId) return;
    const samePlace = sel?.sectionId === sectionId;
    addEl(sectionId, { ...clip, x: Math.min(95, clip.x + (samePlace ? 3 : 0)), y: clip.y + (samePlace ? 32 : 0) });
  };
  const duplicateSel = () => {
    if (!sel || sel.builtin) return;
    const el = findEl(sel.sectionId, sel.id);
    if (!el) return;
    const { id: _id, ...rest } = el;
    void _id;
    addEl(sel.sectionId, { ...rest, x: Math.min(95, el.x + 3), y: el.y + 32 });
  };
  const deleteSel = () => {
    if (!sel) return;
    if (sel.builtin) {
      updateSection(sel.sectionId, (s) => ({
        ...s,
        place: { ...(s.place ?? {}), [sel.id]: { x: 0, y: 0, scale: 1, ...(s.place?.[sel.id] ?? {}), hidden: true } },
      }));
    } else {
      updateSection(sel.sectionId, (s) => {
        const els = (s.els ?? []).filter((e) => e.id !== sel.id);
        return { ...s, els: els.length ? els : undefined };
      });
    }
    setSel(null);
  };
  const setLayer = (where: "front" | "back") => {
    if (!sel) return;
    if (sel.builtin) {
      updateSection(sel.sectionId, (s) => ({
        ...s,
        place: {
          ...(s.place ?? {}),
          [sel.id]: { x: 0, y: 0, scale: 1, ...(s.place?.[sel.id] ?? {}), z: where === "front" ? 20 : 1 },
        },
      }));
    } else {
      const sec = layout.sections.find((s) => s.id === sel.sectionId);
      const top = Math.max(10, ...(sec?.els ?? []).map((e) => e.z));
      updateEl(sel.sectionId, sel.id, { z: where === "front" ? Math.min(99, top + 1) : 1 });
    }
  };
  const resetBuiltin = () => {
    if (!sel?.builtin) return;
    updateSection(sel.sectionId, (s) => {
      const place = { ...(s.place ?? {}) };
      delete place[sel.id];
      return { ...s, place: Object.keys(place).length ? place : undefined };
    });
  };

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
      } else if (mod && e.key.toLowerCase() === "c" && sel) {
        e.preventDefault();
        copySel();
      } else if (mod && e.key.toLowerCase() === "v" && clip) {
        e.preventDefault();
        pasteEl();
      } else if (mod && e.key.toLowerCase() === "d" && sel && !sel.builtin) {
        e.preventDefault();
        duplicateSel();
      } else if ((e.key === "Delete" || e.key === "Backspace") && sel) {
        e.preventDefault();
        deleteSel();
      } else if (e.key === "m" && !mod) {
        setMoveMode((m) => !m);
      } else if (e.key === "Escape") {
        if (textSel) setTextSel(null);
        else if (sel) setSel(null);
        else {
          setMoveMode(false);
          setSelectedId(null);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, saveDraft, undo, redo, sel, textSel, clip, selectedId]);

  // Warn before leaving with unpublished work.
  useEffect(() => {
    if (!unpublished) return;
    const onLeave = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [unpublished]);

  // The page is laid out at the real screen width, then shrunk to fit between
  // the panels — so what you arrange here is exactly what the live site shows.
  const [view, setView] = useState({ w: 0, zoom: 1 });
  useEffect(() => {
    const measure = () => {
      const w = document.documentElement.clientWidth;
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const wide = window.innerWidth >= 1280;
      const pad = wide ? (showLayers ? 17 * rem : 0) + (showPanel ? 19.5 * rem : 0) : 0;
      setView({ w, zoom: Math.max(0.3, (w - pad) / w) });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [showLayers, showPanel]);

  const editApi = useMemo(
    () => ({
      editing: true,
      zoom: view.zoom,
      moveMode,
      sel,
      textSel,
      selectText: (t: TextSel) => {
        setTextSel(t);
        if (t) {
          setSel(null);
          setSelectedId(t.sectionId);
        }
      },
      selSection: selectedId,
      selectEl: (next: Sel) => {
        setSel(next);
        if (next) setTextSel(null);
        if (next) {
          setSelectedId(next.sectionId);
          setTab("element");
          setShowPanel(true);
        }
      },
      updateEl,
      setFixedH: (sectionId: string, h: number | null) =>
        updateSection(sectionId, (s) => {
          const style = { ...(s.style ?? {}) };
          if (h === null) delete style.fixedH;
          else style.fixedH = h;
          return { ...s, style: Object.keys(style).length ? style : undefined };
        }),
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
    [moveMode, sel, textSel, selectedId, updateEl, updateSection, view.zoom]
  );

  /* ----- section actions ----- */
  const select = (id: string) => {
    setSelectedId(id);
    setSel(null);
    setTextSel(null);
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
  const setSmoothBg = (on: boolean) => commit((l) => ({ ...l, smoothBg: on || undefined }));
  const setFmt = (sectionId: string, key: string, patch: Partial<TextFmt> | null) =>
    updateSection(sectionId, (s) => {
      const fmt = { ...(s.fmt ?? {}) };
      if (patch === null) delete fmt[key];
      else {
        const merged: TextFmt = { ...(fmt[key] ?? {}), ...patch };
        (Object.keys(merged) as (keyof TextFmt)[]).forEach((k) => merged[k] === undefined && delete merged[k]);
        if (Object.keys(merged).length) fmt[key] = merged;
        else delete fmt[key];
      }
      return { ...s, fmt: Object.keys(fmt).length ? fmt : undefined };
    });
  const moveShowcase = (sectionId: string, id: number, dir: -1 | 1) =>
    updateSection(sectionId, (s) => {
      const order = [...showOrderOf(s)];
      const i = order.indexOf(id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= order.length) return s;
      [order[i], order[j]] = [order[j], order[i]];
      return { ...s, showOrder: order };
    });

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
        <div style={view.w ? { width: view.w, zoom: view.zoom } : undefined}>
          <EditProvider value={editApi}>
            <HomeSections layout={layout} slots={slots} canvas={{ selectedId, select }} />
          </EditProvider>
        </div>
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
                  title="Move up"
                  disabled={i === 0}
                  className="text-xs opacity-60 hover:opacity-100 disabled:opacity-20"
                  onClick={(e) => {
                    e.stopPropagation();
                    moveTo(i, i - 1);
                  }}
                >
                  ↑
                </button>
                <button
                  type="button"
                  title="Move down"
                  disabled={i === layout.sections.length - 1}
                  className="text-xs opacity-60 hover:opacity-100 disabled:opacity-20"
                  onClick={(e) => {
                    e.stopPropagation();
                    moveTo(i, i + 1);
                  }}
                >
                  ↓
                </button>
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
                ["element", "Element"],
                ["site", "Look"],
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
                  {layout.smoothBg && (
                    <p className="rounded-md bg-white/5 p-2 text-[11px] text-[#b3a5a2]">
                      The page uses one smooth background, so section colours are off. Switch to “Section colours” in the Look tab to use them.
                    </p>
                  )}
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
                      ["flat", "Minimal"],
                      ["tight", "Shorter"],
                      ["normal", "Normal"],
                      ["roomy", "Taller"],
                      ["screen", "Full screen"],
                    ]}
                    onChange={(height) => setStyle(selected.id, { height })}
                  />
                  <div className="flex items-center gap-2 text-xs text-[#b3a5a2]">
                    <span>Exact height</span>
                    <input
                      key={`${selected.id}-${selectedStyle.fixedH ?? "auto"}`}
                      type="number"
                      min={16}
                      max={3000}
                      step={8}
                      placeholder="auto"
                      defaultValue={selectedStyle.fixedH ?? ""}
                      onBlur={(e) => {
                        const raw = e.currentTarget.value.trim();
                        editApi.setFixedH(selected.id, raw === "" ? null : Math.max(16, Math.min(3000, Number(raw) || 16)));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur();
                      }}
                      className="w-20 rounded-md border border-[#3a2a2d] bg-black/30 px-2 py-1 text-sm text-[#f4efe9]"
                    />
                    <span>px</span>
                  </div>
                  <label className="block text-xs text-[#b3a5a2]">
                    <input
                      type="range"
                      min={16}
                      max={1600}
                      step={8}
                      value={selectedStyle.fixedH ?? 600}
                      onChange={(e) => editApi.setFixedH(selected.id, Number(e.target.value))}
                      className="mt-1 w-full accent-[#f5c84c]"
                    />
                  </label>
                  {selectedStyle.fixedH && (
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={!!selectedStyle.spill}
                        onChange={(e) => setStyle(selected.id, { spill: e.target.checked })}
                        className="accent-[#f5c84c]"
                      />
                      Let things spill outside (otherwise anything taller is cropped)
                    </label>
                  )}
                  <div className="flex gap-2">
                    {selectedStyle.fixedH && (
                      <button
                        type="button"
                        onClick={() => editApi.setFixedH(selected.id, null)}
                        className="rounded-full bg-white/5 px-3 py-1.5 text-[11px] font-bold hover:bg-white/10"
                      >
                        Automatic height
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-[#b3a5a2]">Tip: hover any section on the page and drag the yellow bar at its bottom edge.</p>
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
                            <span className="flex gap-1">
                              {imgs.length > 0 && (
                                <button
                                  type="button"
                                  title="Remove these photos (the spot stays empty until you add new ones)"
                                  onClick={() =>
                                    updateSection(selected.id, (x) => ({ ...x, images: { ...(x.images ?? {}), [slot]: [] } }))
                                  }
                                  className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase text-[#ff9a9a] hover:bg-white/10"
                                >
                                  Remove all
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setPicker({ mode: "slot", sectionId: selected.id, slot })}
                                className="rounded-full bg-[#f5c84c] px-3 py-1 text-[10px] font-bold uppercase text-black"
                              >
                                {imgs.length ? "Choose" : "+ Add"}
                              </button>
                            </span>
                          </div>
                          <div className="flex gap-1 overflow-hidden">
                            {imgs.slice(0, 6).map((u, i) => (
                              <img key={u + i} src={u} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
                            ))}
                            {imgs.length > 6 && <span className="self-center text-[10px] text-[#b3a5a2]">+{imgs.length - 6}</span>}
                            {!imgs.length && <span className="text-[10px] text-[#b3a5a2]">Empty — nothing shows on the site</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {selected.type === "showcases" && (
                  <div className="space-y-2">
                    <p className={label}>Order of the four</p>
                    <ol className="space-y-1">
                      {showOrderOf(selected).map((id, pos, arr) => (
                        <li key={id} className="flex items-center gap-2 rounded-md bg-white/5 px-2 py-1.5 text-xs">
                          <span className="w-5 font-black text-[#f5c84c]">{pos + 1}</span>
                          <span className="flex-1 truncate font-bold">{textOf(selected, `s${id}title`)}</span>
                          <button
                            type="button"
                            disabled={pos === 0}
                            onClick={() => moveShowcase(selected.id, id, -1)}
                            className="rounded px-1.5 py-0.5 hover:bg-white/10 disabled:opacity-20"
                            title="Move up"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            disabled={pos === arr.length - 1}
                            onClick={() => moveShowcase(selected.id, id, 1)}
                            className="rounded px-1.5 py-0.5 hover:bg-white/10 disabled:opacity-20"
                            title="Move down"
                          >
                            ↓
                          </button>
                        </li>
                      ))}
                    </ol>
                    <p className={label}>Photography photos</p>
                    <Seg<"polaroid" | "original">
                      value={selectedStyle.photos ?? "polaroid"}
                      options={[
                        ["original", "Original photos"],
                        ["polaroid", "Polaroid frames"],
                      ]}
                      onChange={(photos) => setStyle(selected.id, { photos })}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <p className={label}>Add to this section</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(
                      [
                        ["text", "Text"],
                        ["image", "Image"],
                        ["button", "Button"],
                        ["shape", "Shape"],
                        ["signature", "Signature"],
                      ] as const
                    ).map(([k, t]) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => addElement(k)}
                        className="rounded-lg bg-white/5 py-2 text-[11px] font-bold hover:bg-[#f5c84c] hover:text-black"
                      >
                        + {t}
                      </button>
                    ))}
                  </div>
                  {clip && (
                    <button type="button" onClick={pasteEl} className="w-full rounded-lg bg-white/5 py-2 text-[11px] font-bold hover:bg-white/10">
                      Paste copied {clip.kind} here
                    </button>
                  )}
                  {(selected.els?.length ?? 0) > 0 && (
                    <ul className="space-y-1">
                      {selected.els!.map((el) => (
                        <li key={el.id}>
                          <button
                            type="button"
                            onClick={() => editApi.selectEl({ sectionId: selected.id, id: el.id, builtin: false })}
                            className="flex w-full items-center gap-2 rounded-md bg-white/5 px-2 py-1.5 text-left text-[11px] hover:bg-white/10"
                          >
                            <span className="font-bold capitalize">{el.kind}</span>
                            <span className="flex-1 truncate text-[#b3a5a2]">{el.text ?? ""}</span>
                            <span className="text-[#b3a5a2]">layer {el.z}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

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

            {tab === "element" && !sel && (
              <p className="text-sm text-[#b3a5a2]">
                Click an element you added (or turn on Move &amp; resize and click a built-in piece) to edit it here.
              </p>
            )}

            {tab === "element" &&
              sel &&
              (() => {
                if (sel.builtin) {
                  const p = layout.sections.find((s) => s.id === sel.sectionId)?.place?.[sel.id];
                  const node = typeof document !== "undefined" ? document.querySelector<HTMLElement>(`[data-el="${sel.sectionId}:${sel.id}"]`) : null;
                  return (
                    <div className="space-y-4">
                      <div>
                        <p className="text-base font-black">{node?.dataset.label ?? "Piece"}</p>
                        <p className="text-xs text-[#b3a5a2]">Built-in piece of this section.</p>
                      </div>
                      <p className="text-xs text-[#b3a5a2]">
                        Drag it on the page to move, pull the corner to resize. Size: {Math.round((p?.scale ?? 1) * 100)}% · layer {p?.z ?? "normal"}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={copySel} className="rounded-full bg-white/5 px-3 py-1.5 text-[11px] font-bold hover:bg-white/10">
                          Copy as free element
                        </button>
                        <button type="button" onClick={() => setLayer("front")} className="rounded-full bg-white/5 px-3 py-1.5 text-[11px] font-bold hover:bg-white/10">
                          Bring to front
                        </button>
                        <button type="button" onClick={() => setLayer("back")} className="rounded-full bg-white/5 px-3 py-1.5 text-[11px] font-bold hover:bg-white/10">
                          Send back
                        </button>
                        <button type="button" onClick={resetBuiltin} className="rounded-full bg-white/5 px-3 py-1.5 text-[11px] font-bold hover:bg-white/10">
                          Reset
                        </button>
                        <button type="button" onClick={deleteSel} className="rounded-full bg-[#8e1b3a] px-3 py-1.5 text-[11px] font-bold">
                          Remove from page
                        </button>
                      </div>
                      <p className="text-[11px] text-[#b3a5a2]">Removed pieces show a “Restore” button where they were.</p>
                    </div>
                  );
                }
                const el = findEl(sel.sectionId, sel.id);
                if (!el) return <p className="text-sm text-[#b3a5a2]">That element no longer exists.</p>;
                const up = (patch: Partial<El>) => updateEl(sel.sectionId, el.id, patch);
                const isWords = el.kind === "text" || el.kind === "button";
                return (
                  <div className="space-y-4">
                    <div>
                      <p className="text-base font-black capitalize">{el.kind}</p>
                      <p className="text-xs text-[#b3a5a2]">
                        Drag to move · corner to resize{isWords ? " · double-click to type" : ""}. Hold Alt for no snapping.
                      </p>
                    </div>

                    {isWords && (
                      <>
                        <label className="block text-xs">
                          <span className={label}>Words</span>
                          <textarea
                            value={el.text ?? ""}
                            rows={3}
                            onChange={(e) => up({ text: e.target.value })}
                            className="mt-1 w-full rounded-md border border-[#3a2a2d] bg-black/30 p-2 text-sm"
                          />
                        </label>
                        <label className="block text-xs text-[#b3a5a2]">
                          Text size {el.size ?? (el.kind === "button" ? 1.2 : 2.6)}
                          <input
                            type="range"
                            min={0.6}
                            max={14}
                            step={0.1}
                            value={el.size ?? (el.kind === "button" ? 1.2 : 2.6)}
                            onChange={(e) => up({ size: Number(e.target.value) })}
                            className="mt-1 w-full accent-[#f5c84c]"
                          />
                        </label>
                        <div className="space-y-1.5">
                          <p className={label}>Font</p>
                          <Seg<"display" | "sans" | "script">
                            value={el.font ?? "sans"}
                            options={[
                              ["display", "Bold display"],
                              ["sans", "Clean"],
                              ["script", "Handwritten"],
                            ]}
                            onChange={(font) => up({ font })}
                          />
                          <Seg<"400" | "700" | "900">
                            value={String(el.weight ?? 700) as "400" | "700" | "900"}
                            options={[
                              ["400", "Regular"],
                              ["700", "Bold"],
                              ["900", "Black"],
                            ]}
                            onChange={(w) => up({ weight: Number(w) as 400 | 700 | 900 })}
                          />
                          <Seg<"left" | "center" | "right">
                            value={el.align ?? "left"}
                            options={[
                              ["left", "Left"],
                              ["center", "Centre"],
                              ["right", "Right"],
                            ]}
                            onChange={(align) => up({ align })}
                          />
                          <label className="flex items-center gap-2 text-xs">
                            <input type="checkbox" checked={!!el.upper} onChange={(e) => up({ upper: e.target.checked })} className="accent-[#f5c84c]" />
                            CAPITALS
                          </label>
                        </div>
                        <Color title="Text colour" value={el.color ?? "#1a0f10"} onChange={(v) => up({ color: v })} />
                      </>
                    )}

                    {(el.kind === "button" || el.kind === "shape") && (
                      <Color title="Fill colour" value={el.fill ?? (el.kind === "button" ? "#f5c84c" : "#8e1b3a")} onChange={(v) => up({ fill: v })} />
                    )}

                    {(el.kind === "button" || el.kind === "text" || el.kind === "image") && (
                      <label className="block text-xs">
                        <span className={label}>Link (optional)</span>
                        <input
                          value={el.href ?? ""}
                          placeholder="/#quote or https://…"
                          onChange={(e) => up({ href: e.target.value || undefined })}
                          className="mt-1 w-full rounded-md border border-[#3a2a2d] bg-black/30 p-2 text-sm"
                        />
                      </label>
                    )}

                    {el.kind === "image" && (
                      <div className="space-y-2">
                        {el.src && <img src={el.src} alt="" className="h-24 w-full rounded-md object-cover" />}
                        <button
                          type="button"
                          onClick={() => setPicker({ mode: "replace", sectionId: sel.sectionId, id: el.id })}
                          className="w-full rounded-full bg-[#f5c84c] py-2 text-[11px] font-bold uppercase text-black"
                        >
                          Replace image
                        </button>
                        <Seg<"cover" | "contain">
                          value={el.fit ?? "cover"}
                          options={[
                            ["cover", "Fill the box"],
                            ["contain", "Show whole image"],
                          ]}
                          onChange={(fit) => up({ fit })}
                        />
                      </div>
                    )}

                    {(el.kind === "image" || el.kind === "shape") && (
                      <label className="block text-xs text-[#b3a5a2]">
                        Height {el.h ?? 240}
                        <input type="range" min={8} max={1400} value={el.h ?? 240} onChange={(e) => up({ h: Number(e.target.value) })} className="mt-1 w-full accent-[#f5c84c]" />
                      </label>
                    )}

                    <label className="block text-xs text-[#b3a5a2]">
                      Width {el.w}% of the section
                      <input type="range" min={2} max={120} step={0.5} value={el.w} onChange={(e) => up({ w: Number(e.target.value) })} className="mt-1 w-full accent-[#f5c84c]" />
                    </label>
                    {el.kind !== "text" && (
                      <label className="block text-xs text-[#b3a5a2]">
                        Rounded corners {el.radius ?? 0}px
                        <input type="range" min={0} max={200} value={el.radius ?? 0} onChange={(e) => up({ radius: Number(e.target.value) })} className="mt-1 w-full accent-[#f5c84c]" />
                      </label>
                    )}
                    <label className="block text-xs text-[#b3a5a2]">
                      See-through {Math.round((1 - (el.opacity ?? 1)) * 100)}%
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={Math.round((1 - (el.opacity ?? 1)) * 100)}
                        onChange={(e) => up({ opacity: 1 - Number(e.target.value) / 100 })}
                        className="mt-1 w-full accent-[#f5c84c]"
                      />
                    </label>
                    <label className="block text-xs text-[#b3a5a2]">
                      Rotate {el.rotate ?? 0}°
                      <input type="range" min={-180} max={180} value={el.rotate ?? 0} onChange={(e) => up({ rotate: Number(e.target.value) })} className="mt-1 w-full accent-[#f5c84c]" />
                    </label>

                    <div className="space-y-1.5">
                      <p className={label}>Layer {el.z} {el.z <= 2 ? "· behind the section's content" : "· in front"}</p>
                      <div className="flex flex-wrap gap-1.5">
                        <button type="button" onClick={() => setLayer("front")} className="rounded-full bg-white/5 px-3 py-1.5 text-[11px] font-bold hover:bg-white/10">
                          Bring to front
                        </button>
                        <button type="button" onClick={() => up({ z: Math.min(99, el.z + 1) })} className="rounded-full bg-white/5 px-3 py-1.5 text-[11px] font-bold hover:bg-white/10">
                          Forward
                        </button>
                        <button type="button" onClick={() => up({ z: Math.max(1, el.z - 1) })} className="rounded-full bg-white/5 px-3 py-1.5 text-[11px] font-bold hover:bg-white/10">
                          Backward
                        </button>
                        <button type="button" onClick={() => setLayer("back")} className="rounded-full bg-white/5 px-3 py-1.5 text-[11px] font-bold hover:bg-white/10">
                          Send to back
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <p className={label}>Show on</p>
                      <Seg<"all" | "desktop" | "phone">
                        value={el.on ?? "all"}
                        options={[
                          ["all", "All screens"],
                          ["desktop", "Computer & tablet"],
                          ["phone", "Phone only"],
                        ]}
                        onChange={(on) => up({ on })}
                      />
                    </div>

                    <div className="flex flex-wrap gap-2 border-t border-[#3a2a2d] pt-4">
                      <button type="button" onClick={copySel} className="rounded-full bg-white/5 px-3 py-1.5 text-[11px] font-bold hover:bg-white/10">
                        Copy
                      </button>
                      <button type="button" onClick={duplicateSel} className="rounded-full bg-white/5 px-3 py-1.5 text-[11px] font-bold hover:bg-white/10">
                        Duplicate
                      </button>
                      <button type="button" onClick={deleteSel} className="rounded-full bg-[#8e1b3a] px-3 py-1.5 text-[11px] font-bold">
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })()}

            {tab === "site" && (
              <>
                <div className="space-y-2">
                  <p className={label}>Page background</p>
                  <Seg<"smooth" | "own">
                    value={layout.smoothBg ? "smooth" : "own"}
                    options={[
                      ["own", "Section colours"],
                      ["smooth", "One smooth background"],
                    ]}
                    onChange={(v) => setSmoothBg(v === "smooth")}
                  />
                  <p className="text-[11px] text-[#b3a5a2]">
                    Section colours: a section shows the background you pick for it (Section tab → Background); sections left on “Page” use the purple-to-gold base. One smooth background: ignores section colours.
                  </p>
                </div>
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
          if (!s) return null;
          if (picker.mode === "new" || picker.mode === "replace") {
            const existing = picker.mode === "replace" ? findEl(s.id, picker.id) : undefined;
            return (
              <ImagePicker
                title={picker.mode === "new" ? "Add an image" : "Replace image"}
                max={1}
                current={existing?.src ? [existing.src] : []}
                onClose={() => setPicker(null)}
                onSave={(urls) => {
                  const url = urls?.[0] ?? PHOTOS[0].thumb;
                  if (picker.mode === "new") addEl(s.id, { kind: "image", x: 10, y: 60, w: 26, h: 300, z: 10, src: url, fit: "cover", radius: 6 });
                  else updateEl(s.id, picker.id, { src: url });
                  setPicker(null);
                }}
              />
            );
          }
          const slot = picker.slot;
          const def = SECTION_LIBRARY[s.type].slots?.[slot];
          if (!def) return null;
          return (
            <ImagePicker
              title={`${SECTION_LIBRARY[s.type].label} · ${def.label}`}
              max={def.max}
              current={s.images?.[slot] ?? []}
              onClose={() => setPicker(null)}
              onSave={(urls) => {
                updateSection(s.id, (x) => {
                  const images = { ...(x.images ?? {}) };
                  // null = back to the sample photos; [] = leave the spot empty.
                  if (urls) images[slot] = urls;
                  else delete images[slot];
                  return { ...x, images: Object.keys(images).length ? images : undefined };
                });
                setPicker(null);
              }}
            />
          );
        })()}

      {/* ----- Text look bar ----- */}
      {textSel && (
        <TextFormatBar
          target={textSel}
          fmt={layout.sections.find((s) => s.id === textSel.sectionId)?.fmt?.[textSel.key]}
          onChange={(patch) => setFmt(textSel.sectionId, textSel.key, patch)}
          onReset={() => setFmt(textSel.sectionId, textSel.key, null)}
        />
      )}

      {/* ----- Selected element toolbar ----- */}
      {sel && (
        <ElementToolbar
          sel={sel}
          isCustom={!sel.builtin}
          hasClip={!!clip}
          removed={!!(sel.builtin && layout.sections.find((s) => s.id === sel.sectionId)?.place?.[sel.id]?.hidden)}
          onCopy={copySel}
          onPaste={pasteEl}
          onDuplicate={duplicateSel}
          onFront={() => setLayer("front")}
          onBack={() => setLayer("back")}
          onDelete={deleteSel}
          onReplace={
            !sel.builtin && findEl(sel.sectionId, sel.id)?.kind === "image"
              ? () => setPicker({ mode: "replace", sectionId: sel.sectionId, id: sel.id })
              : undefined
          }
          onReset={sel.builtin ? resetBuiltin : undefined}
          layoutKey={JSON.stringify(layout.sections.find((s) => s.id === sel.sectionId)?.els ?? "") + JSON.stringify(layout.sections.find((s) => s.id === sel.sectionId)?.place ?? "")}
        />
      )}

      {/* ----- Add element menu ----- */}
      {addingEl && (
        <div data-mode="dark" className={`${panel} fixed bottom-20 left-1/2 z-[97] grid -translate-x-1/2 grid-cols-5 gap-1.5 p-2`}>
          {(
            [
              ["text", "Text"],
              ["image", "Image"],
              ["button", "Button"],
              ["shape", "Shape"],
              ["signature", "Signature"],
            ] as const
          ).map(([k, t]) => (
            <button key={k} type="button" onClick={() => addElement(k)} className="rounded-lg px-4 py-2 text-xs font-bold hover:bg-[#f5c84c] hover:text-black">
              + {t}
            </button>
          ))}
        </div>
      )}

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
          <button type="button" className={`${btn} ${addingEl ? "bg-white/15" : "hover:bg-white/10"}`} onClick={() => setAddingEl((v) => !v)} title="Add text, image, button or shape">
            ＋ Element
          </button>
          {clip && (
            <button type="button" className={`${btn} hover:bg-white/10`} onClick={pasteEl} title="Paste (Ctrl+V)">
              Paste
            </button>
          )}
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
