"use client";

/* eslint-disable @next/next/no-img-element */
import {
  createContext,
  useContext,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";
import { SECTION_LIBRARY, type El, type Entrance, type Placement, type Section } from "./layout-types";

/** What is selected on the canvas: a built-in piece of a section, or a free element. */
export type TextSel = { sectionId: string; key: string } | null;

export type Sel = { sectionId: string; id: string; builtin: boolean } | null;

type EditApi = {
  editing: boolean;
  /** "Move & resize" mode: built-in pieces can be dragged and scaled instead of typed in. */
  moveMode: boolean;
  sel: Sel;
  textSel: TextSel;
  selectText: (t: TextSel) => void;
  selSection: string | null;
  setText: (sectionId: string, key: string, value: string) => void;
  setPlace: (sectionId: string, elId: string, place: Placement | null) => void;
  selectEl: (sel: Sel) => void;
  updateEl: (sectionId: string, id: string, patch: Partial<El>) => void;
  setFixedH: (sectionId: string, h: number | null) => void;
};

const noop = () => {};
const EditContext = createContext<EditApi>({
  editing: false,
  moveMode: false,
  sel: null,
  textSel: null,
  selectText: noop,
  selSection: null,
  setText: noop,
  setPlace: noop,
  selectEl: noop,
  updateEl: noop,
  setFixedH: noop,
});

export function EditProvider({ value, children }: { value: EditApi; children: ReactNode }) {
  return <EditContext.Provider value={value}>{children}</EditContext.Provider>;
}

export function useEdit() {
  return useContext(EditContext);
}
export function useEditing() {
  return useContext(EditContext).editing;
}

/** Entrance animation chosen for the section being rendered (read by Reveal). */
export const EntranceContext = createContext<Entrance>("rise");

/** The section's saved words for `k`, or the design's default words. */
export function textOf(s: Section, k: string) {
  return s.text[k] ?? SECTION_LIBRARY[s.type].defaults[k] ?? "";
}

/**
 * One editable piece of text. On the live site it's plain text; inside the
 * admin editor it becomes click-to-edit (saved into the layout on blur).
 */
const FMT_FONT = {
  display: "var(--font-display)",
  sans: "var(--font-sans)",
  script: "var(--font-script)",
} as const;

export function Txt({ s, k, as: Tag = "span", className = "" }: { s: Section; k: string; as?: ElementType; className?: string }) {
  const { editing, moveMode, textSel, selectText, setText } = useContext(EditContext);
  const value = textOf(s, k);
  const f = s.fmt?.[k];
  // The text's own look (colour, font, size, weight) on top of the design's.
  const style: CSSProperties | undefined = f
    ? {
        ...(f.color ? { color: f.color, WebkitTextFillColor: f.color, background: "none" } : {}),
        ...(f.font ? { fontFamily: FMT_FONT[f.font] } : {}),
        ...(f.size ? { zoom: f.size } : {}),
        ...(f.weight ? { fontWeight: f.weight } : {}),
        ...(f.italic ? { fontStyle: "italic" } : {}),
      }
    : undefined;
  if (!editing || moveMode) {
    return (
      <Tag className={className} style={style}>
        {value}
      </Tag>
    );
  }
  const isSel = textSel?.sectionId === s.id && textSel.key === k;
  return (
    <Tag
      data-txt={`${s.id}:${k}`}
      className={`${className} cursor-text rounded-sm outline-dashed outline-1 outline-offset-4 transition-[outline-color] ${
        isSel ? "outline-spark" : "outline-transparent hover:outline-spark/70"
      }`}
      style={style}
      contentEditable
      suppressContentEditableWarning
      spellCheck
      onFocus={() => selectText({ sectionId: s.id, key: k })}
      onClick={(e: React.MouseEvent) => e.preventDefault()}
      onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
        if (e.key === "Escape") e.currentTarget.blur();
      }}
      onBlur={(e: React.FocusEvent<HTMLElement>) => {
        const next = e.currentTarget.innerText.trim();
        if (next !== value) setText(s.id, k, next);
      }}
    >
      {value}
    </Tag>
  );
}

/**
 * A built-in piece of a section that can be dragged, resized, layered above or
 * below other things, copied, or removed in the editor's "Move & resize"
 * mode. The offset and size apply on screens 768px and wider; on phones the
 * page keeps its normal stacked layout so nothing ends up off screen.
 * Double-click a piece in move mode to put it back where it was.
 */
export function Movable({
  s,
  id,
  label,
  className = "",
  children,
}: {
  s: Section;
  id: string;
  label?: string;
  className?: string;
  children: ReactNode;
}) {
  const { editing, moveMode, sel, setPlace, selectEl } = useContext(EditContext);
  const saved = s.place?.[id];
  const [live, setLive] = useState<Placement | null>(null);
  const drag = useRef<{ kind: "move" | "resize"; x: number; y: number; start: Placement; w: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const cur = live ?? saved ?? { x: 0, y: 0, scale: 1 };
  const isSel = !!sel && sel.sectionId === s.id && sel.id === id && sel.builtin;

  // Removed pieces vanish (the section closes up around the gap).
  if (saved?.hidden) {
    if (!editing) return null;
    return (
      <div className="relative z-[3] my-1" data-mode="dark">
        <button
          type="button"
          onClick={() => setPlace(s.id, id, { ...cur, hidden: false })}
          className="rounded-full border border-dashed border-[#f5c84c]/70 bg-[#0d090a]/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#f5c84c] hover:bg-[#f5c84c] hover:text-black"
        >
          ↺ Restore “{label ?? id}”
        </button>
      </div>
    );
  }

  const placed = !!saved || !!live;
  const style: CSSProperties = {
    ...(placed
      ? ({ ["--mx" as string]: `${cur.x}px`, ["--my" as string]: `${cur.y}px`, ["--ms" as string]: cur.scale } as CSSProperties)
      : {}),
    // A layer above neighbouring sections' backgrounds: moved pieces always sit in front.
    ...(placed ? { zIndex: (saved as Placement | undefined)?.z ?? 5 } : {}),
  };
  const cls = `${className} relative md:[translate:var(--mx,0px)_var(--my,0px)] md:[scale:var(--ms,1)]`;

  if (!editing || !moveMode) {
    return (
      <div className={cls} style={style} data-el={`${s.id}:${id}`} data-label={label ?? id}>
        {children}
      </div>
    );
  }

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    selectEl({ sectionId: s.id, id, builtin: true });
    const kind = (e.target as HTMLElement).dataset.handle === "resize" ? "resize" : "move";
    drag.current = { kind, x: e.clientX, y: e.clientY, start: cur, w: ref.current?.offsetWidth || 300 };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (d.kind === "move") {
      // Snap to an 8px grid unless Alt is held.
      const snap = (v: number) => (e.altKey ? v : Math.round(v / 8) * 8);
      setLive({ ...d.start, x: snap(d.start.x + dx), y: snap(d.start.y + dy) });
    } else {
      const scale = Math.max(0.3, Math.min(3, d.start.scale * (1 + dx / d.w)));
      setLive({ ...d.start, scale: Math.round(scale * 100) / 100 });
    }
  };
  const onPointerUp = () => {
    if (drag.current && live) setPlace(s.id, id, live);
    drag.current = null;
    setLive(null);
  };

  return (
    <div
      ref={ref}
      data-el={`${s.id}:${id}`}
      data-label={label ?? id}
      className={`${cls} cursor-move touch-none outline-dashed outline-2 outline-offset-4 ${
        isSel ? "outline-[#f5c84c]" : "outline-[#f5c84c]/40 hover:outline-[#f5c84c]"
      }`}
      style={style}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={() => setPlace(s.id, id, saved?.z ? { x: 0, y: 0, scale: 1, z: saved.z } : null)}
      title="Drag to move · drag the corner to resize · double-click to reset"
    >
      <div className="pointer-events-none select-none">{children}</div>
      <span className="pointer-events-none absolute -top-6 left-0 z-20 rounded bg-[#f5c84c] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black">
        {label ?? id}
        {cur.scale !== 1 ? ` · ${Math.round(cur.scale * 100)}%` : ""}
      </span>
      <span
        data-handle="resize"
        className="absolute -bottom-2 -right-2 z-20 h-4 w-4 cursor-nwse-resize rounded-sm border-2 border-black bg-[#f5c84c]"
      />
    </div>
  );
}

/* ---------- free elements ---------- */

const FONTS: Record<NonNullable<El["font"]>, string> = {
  display: "var(--font-display)",
  sans: "var(--font-sans)",
  script: "var(--font-script)",
};

/** The visual of one free element (the same in the editor and on the live site). */
export function ElBody({ el, editingText, onText }: { el: El; editingText?: boolean; onText?: (v: string) => void }) {
  if (el.kind === "image") {
    return el.src ? (
      <img
        src={el.src}
        alt=""
        draggable={false}
        className="block w-full select-none"
        style={{
          height: el.h ? `calc(${el.h} * 100cqw / 1000)` : "auto",
          objectFit: el.fit ?? "cover",
          borderRadius: el.radius ? `${el.radius}px` : undefined,
        }}
      />
    ) : (
      <div className="flex h-24 items-center justify-center bg-black/10 text-xs">No image</div>
    );
  }
  if (el.kind === "shape") {
    return (
      <div
        style={{ height: `calc(${el.h ?? 80} * 100cqw / 1000)`, background: el.fill ?? "#8e1b3a", borderRadius: el.radius ? `${el.radius}px` : undefined }}
      />
    );
  }
  const textStyle: CSSProperties = {
    fontSize: `${el.size ?? 2.4}cqw`,
    fontWeight: el.weight ?? 700,
    color: el.color ?? "var(--ink)",
    textAlign: el.align ?? "left",
    fontFamily: FONTS[el.font ?? "sans"],
    textTransform: el.upper ? "uppercase" : undefined,
    lineHeight: 1.15,
    whiteSpace: "pre-wrap",
  };
  const content = (
    <span
      contentEditable={!!editingText}
      suppressContentEditableWarning
      spellCheck
      onBlur={(e) => onText?.(e.currentTarget.innerText)}
      className={editingText ? "block cursor-text outline-none" : "block"}
      style={textStyle}
    >
      {el.text ?? ""}
    </span>
  );
  if (el.kind === "button") {
    return (
      <span
        className="inline-block"
        style={{
          background: el.fill ?? "var(--spark)",
          color: el.color ?? "#160b0d",
          borderRadius: `${el.radius ?? 999}px`,
          padding: "0.6em 1.4em",
          fontSize: `${el.size ?? 1.3}cqw`,
          fontWeight: el.weight ?? 700,
          fontFamily: FONTS[el.font ?? "sans"],
          textTransform: el.upper === false ? undefined : "uppercase",
          letterSpacing: "0.12em",
        }}
      >
        <span
          contentEditable={!!editingText}
          suppressContentEditableWarning
          onBlur={(e) => onText?.(e.currentTarget.innerText)}
          className={editingText ? "cursor-text outline-none" : ""}
        >
          {el.text ?? "Button"}
        </span>
      </span>
    );
  }
  return content;
}

/**
 * The free elements added to a section. Percent-based so they scale on every
 * screen. In the editor they can be dragged, resized (corner handle) and typed
 * into (double-click).
 */
export function ElementsLayer({ s }: { s: Section }) {
  const { editing, sel, selectEl, updateEl } = useContext(EditContext);
  const els = s.els ?? [];
  const layerRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: string; kind: "move" | "resize"; px: number; py: number; el: El; w: number } | null>(null);
  const [typing, setTyping] = useState<string | null>(null);
  if (!els.length && !editing) return null;

  const onDown = (e: React.PointerEvent<HTMLDivElement>, el: El) => {
    if (!editing || typing === el.id || e.button !== 0) return;
    e.stopPropagation();
    selectEl({ sectionId: s.id, id: el.id, builtin: false });
    const w = layerRef.current?.offsetWidth || 1000;
    drag.current = {
      id: el.id,
      kind: (e.target as HTMLElement).dataset.handle === "resize" ? "resize" : "move",
      px: e.clientX,
      py: e.clientY,
      el,
      w,
    };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const dxPct = ((e.clientX - d.px) / d.w) * 100;
    // Vertical movement in 1/1000s of the section width (see El in layout-types).
    const dy = ((e.clientY - d.py) / d.w) * 1000;
    if (d.kind === "move") {
      const snapX = (v: number) => (e.altKey ? v : Math.round(v * 2) / 2);
      const snapY = (v: number) => (e.altKey ? Math.round(v) : Math.round(v / 4) * 4);
      updateEl(s.id, d.id, { x: snapX(d.el.x + dxPct), y: snapY(d.el.y + dy) });
    } else {
      const patch: Partial<El> = { w: Math.max(2, Math.round((d.el.w + dxPct) * 10) / 10) };
      if (d.el.kind === "image" || d.el.kind === "shape") patch.h = Math.max(12, Math.round((d.el.h ?? 240) + dy));
      updateEl(s.id, d.id, patch);
    }
  };
  const onUp = () => {
    drag.current = null;
  };

  return (
    <div ref={layerRef} className="pointer-events-none absolute inset-0" style={{ containerType: "inline-size" }}>
      {els.map((el) => {
        const isSel = !!sel && sel.sectionId === s.id && sel.id === el.id && !sel.builtin;
        const vis = el.on === "desktop" ? "max-md:hidden" : el.on === "phone" ? "md:hidden" : "";
        return (
          <div
            key={el.id}
            data-el={`${s.id}:${el.id}`}
            data-label={`${el.kind[0].toUpperCase()}${el.kind.slice(1)}`}
            className={`pointer-events-auto absolute ${vis} ${editing ? "cursor-move touch-none" : ""} ${
              isSel ? "outline-dashed outline-2 outline-offset-2 outline-[#f5c84c]" : editing ? "hover:outline hover:outline-1 hover:outline-offset-2 hover:outline-[#f5c84c]/60" : ""
            }`}
            style={{
              left: `${el.x}%`,
              top: `calc(${el.y} * 100cqw / 1000)`,
              width: `${el.w}%`,
              zIndex: el.z,
              opacity: el.opacity ?? 1,
              transform: el.rotate ? `rotate(${el.rotate}deg)` : undefined,
            }}
            onPointerDown={(e) => onDown(e, el)}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            onDoubleClick={() => editing && (el.kind === "text" || el.kind === "button") && setTyping(el.id)}
          >
            {el.href && !editing && (el.kind === "button" || el.kind === "text" || el.kind === "image") ? (
              <a href={el.href} className="block">
                <ElBody el={el} />
              </a>
            ) : (
              <ElBody
                el={el}
                editingText={editing && typing === el.id}
                onText={(v) => {
                  setTyping(null);
                  if (v !== el.text) updateEl(s.id, el.id, { text: v });
                }}
              />
            )}
            {isSel && (
              <span
                data-handle="resize"
                className="absolute -bottom-2 -right-2 z-20 h-4 w-4 cursor-nwse-resize rounded-sm border-2 border-black bg-[#f5c84c]"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
