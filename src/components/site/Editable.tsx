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
  /** How much the editor shrinks the page to fit between its panels (1 = real size). */
  zoom: number;
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
  zoom: 1,
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
  // The text's own look sits on an inner span so it layers on top of the
  // design: size is a multiple of the design's size (em), so the box, line
  // wrapping and phone sizing all keep working.
  const style: CSSProperties | undefined = f
    ? {
        ...(f.color ? { color: f.color, WebkitTextFillColor: f.color } : {}),
        ...(f.font ? { fontFamily: FMT_FONT[f.font] } : {}),
        ...(f.size ? { fontSize: `${f.size}em` } : {}),
        ...(f.weight ? { fontWeight: f.weight } : {}),
        ...(f.italic ? { fontStyle: "italic" } : {}),
      }
    : undefined;
  if (!editing || moveMode) {
    return (
      <Tag className={className}>
        <span style={style}>{value}</span>
      </Tag>
    );
  }
  const isSel = textSel?.sectionId === s.id && textSel.key === k;
  return (
    <Tag className={className}>
      <span
        data-txt={`${s.id}:${k}`}
        className={`cursor-text rounded-sm outline-dashed outline-1 outline-offset-4 transition-[outline-color] ${
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
      </span>
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
  const { editing, moveMode, sel, setPlace, selectEl, zoom } = useContext(EditContext);
  const saved = s.place?.[id];
  const [live, setLive] = useState<Placement | null>(null);
  const drag = useRef<{ kind: "move" | "resize"; x: number; y: number; start: Placement; w: number; secW: number; off0: number } | null>(null);
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
      ? ({ ["--mx" as string]: offset(cur, cur.x), ["--my" as string]: offset(cur, cur.y), ["--ms" as string]: cur.scale } as CSSProperties)
      : {}),
    // A layer above neighbouring sections' backgrounds: moved pieces always sit in front.
    ...(placed ? { zIndex: (saved as Placement | undefined)?.z ?? 5 } : {}),
  };
  const cls = `${className} relative md:[translate:var(--mx,0px)_var(--my,0px)] md:[scale:var(--ms,1)]`;

  if (!editing) {
    return (
      <div className={cls} style={style} data-el={`${s.id}:${id}`} data-label={label ?? id}>
        {children}
      </div>
    );
  }

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const handle = (e.target as HTMLElement).closest("[data-handle]")?.getAttribute("data-handle");
    if (handle === "delete") return;
    // Outside "Move & resize" mode only the grip and corner handle drag, so
    // clicking the words still edits them.
    if (!moveMode && !handle) return;
    e.preventDefault();
    e.stopPropagation();
    selectEl({ sectionId: s.id, id, builtin: true });
    const kind = handle === "resize" ? "resize" : "move";
    const secEl = ref.current?.closest("[data-sec]") as HTMLElement | null;
    const secW = secEl?.offsetWidth || 1200;
    // How far (on screen) the middle of this piece is from the middle of the section.
    const r = ref.current?.getBoundingClientRect();
    const sr = secEl?.getBoundingClientRect();
    const off0 = r && sr ? r.left + r.width / 2 - (sr.left + sr.width / 2) : 9999;
    // Older placements were saved in pixels; switch them to section-width units.
    const start: Placement = cur.u ? cur : { ...cur, x: (cur.x / secW) * 1000, y: (cur.y / secW) * 1000, u: 1 };
    drag.current = { kind, x: e.clientX, y: e.clientY, start, w: ref.current?.offsetWidth || 300, secW, off0 };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    // Pointer moves are on screen; the page inside the editor is zoomed.
    let sdx = e.clientX - d.x;
    // Snap to the centre line when close to it (hold Alt to move freely).
    const centred = d.kind === "move" && !e.altKey && Math.abs(d.off0 + sdx) < 10;
    if (centred) sdx = -d.off0;
    const dx = sdx / zoom;
    const dy = (e.clientY - d.y) / zoom;
    if (d.kind === "move") {
      // Positions are in 1/1000s of the section width so they hold on every screen size.
      const toU = (px: number) => (px / d.secW) * 1000;
      const snap = (v: number) => (e.altKey ? Math.round(v * 10) / 10 : Math.round(v / 4) * 4);
      setLive({ ...d.start, x: centred ? Math.round((d.start.x + toU(dx)) * 10) / 10 : snap(d.start.x + toU(dx)), y: snap(d.start.y + toU(dy)) });
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
      className={`${cls} group/mv ${moveMode ? "cursor-move touch-none" : ""} outline-dashed outline-2 outline-offset-4 ${
        isSel || live ? "outline-[#f5c84c]" : moveMode ? "outline-[#f5c84c]/40 hover:outline-[#f5c84c]" : "outline-transparent hover:outline-[#f5c84c]/50"
      }`}
      style={style}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={() => moveMode && setPlace(s.id, id, saved?.z ? { x: 0, y: 0, scale: 1, z: saved.z } : null)}
      title={moveMode ? "Drag to move · drag the corner to resize · double-click to reset" : undefined}
    >
      <div className={moveMode ? "pointer-events-none select-none" : ""}>{children}</div>
      {/* Tab with the piece's name, a grip to drag it and a button to remove it. */}
      <span
        data-mode="dark"
        className={`absolute -top-7 left-0 z-[70] flex items-center overflow-hidden rounded-md bg-[#f5c84c] text-[10px] font-bold uppercase tracking-wider text-black shadow-lg transition-opacity ${
          isSel || moveMode ? "opacity-100" : "opacity-0 group-hover/mv:opacity-100"
        }`}
      >
        <span data-handle="move" className="flex cursor-grab touch-none items-center gap-1 px-1.5 py-1 hover:bg-black/10 active:cursor-grabbing" title="Drag to move">
          ⠿ {label ?? id}
          {cur.scale !== 1 ? ` · ${Math.round(cur.scale * 100)}%` : ""}
        </span>
        {placed && (
          <button
            type="button"
            data-handle="delete"
            title="Put back where it was"
            className="border-l border-black/20 px-1.5 py-1 hover:bg-black/10"
            onClick={(e) => {
              e.stopPropagation();
              setPlace(s.id, id, saved?.z ? { x: 0, y: 0, scale: 1, z: saved.z } : null);
            }}
          >
            ↺
          </button>
        )}
        <button
          type="button"
          data-handle="delete"
          title="Remove from the page (you can restore it)"
          className="border-l border-black/20 px-1.5 py-1 hover:bg-[#8e1b3a] hover:text-white"
          onClick={(e) => {
            e.stopPropagation();
            setPlace(s.id, id, { ...cur, hidden: true });
          }}
        >
          ✕
        </button>
      </span>
      <span
        data-handle="resize"
        title="Drag to resize"
        className={`absolute -bottom-2 -right-2 z-[70] h-4 w-4 cursor-nwse-resize touch-none rounded-sm border-2 border-black bg-[#f5c84c] transition-opacity ${
          isSel || moveMode ? "opacity-100" : "opacity-0 group-hover/mv:opacity-100"
        }`}
      />
    </div>
  );
}

/** CSS offset for a placement: section-width units (new) or plain pixels (older saves). */
function offset(p: Placement, v: number) {
  return p.u ? `calc(${v} * 100cqw / 1000)` : `${v}px`;
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
    // Scales with the section, but never below a readable size on phones.
    fontSize: `max(${el.size ?? 2.4}cqw, 10px)`,
    fontWeight: el.weight ?? 700,
    color: el.color ?? (el.tone === "warm" ? "var(--warm-text)" : "var(--ink)"),
    textAlign: el.align ?? "left",
    letterSpacing: el.track ? `${el.track}em` : undefined,
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
          fontSize: `max(${el.size ?? 1.3}cqw, 11px)`,
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
  const { editing, sel, selectEl, updateEl, zoom } = useContext(EditContext);
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
    const dxPct = ((e.clientX - d.px) / zoom / d.w) * 100;
    // Vertical movement in 1/1000s of the section width (see El in layout-types).
    const dy = ((e.clientY - d.py) / zoom / d.w) * 1000;
    if (d.kind === "move") {
      const snapX = (v: number) => (e.altKey ? v : Math.round(v * 2) / 2);
      const snapY = (v: number) => (e.altKey ? Math.round(v) : Math.round(v / 4) * 4);
      let x = snapX(d.el.x + dxPct);
      // Snap to the centre line when the middle of the element is close to it.
      if (!e.altKey && Math.abs(x + d.el.w / 2 - 50) < 1.2) x = Math.round((50 - d.el.w / 2) * 10) / 10;
      updateEl(s.id, d.id, { x, y: snapY(d.el.y + dy) });
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
    <div
      ref={layerRef}
      className="pointer-events-none max-md:relative max-md:flex max-md:flex-col max-md:items-center max-md:gap-5 max-md:px-4 max-md:pb-10 max-md:empty:hidden md:absolute md:inset-0"
      style={{ containerType: "inline-size" }}
    >
      {els.map((el) => {
        const isSel = !!sel && sel.sectionId === s.id && sel.id === el.id && !sel.builtin;
        const vis = el.on === "desktop" ? "max-md:hidden" : el.on === "phone" ? "md:hidden" : "";
        return (
          <div
            key={el.id}
            data-el={`${s.id}:${el.id}`}
            data-label={`${el.kind[0].toUpperCase()}${el.kind.slice(1)}`}
            className={`pointer-events-auto absolute max-md:!static max-md:!w-[min(88%,420px)] max-md:![transform:none] ${vis} ${editing ? "cursor-move touch-none" : ""} ${
              isSel ? "outline-dashed outline-2 outline-offset-2 outline-[#f5c84c]" : editing ? "hover:outline hover:outline-1 hover:outline-offset-2 hover:outline-[#f5c84c]/60" : ""
            }`}
            style={{
              left: `${el.x}%`,
              top: `calc(${el.y} * 100cqw / 1000)`,
              width: `${el.w}%`,
              zIndex: el.z,
              // Phone stacking order follows the desktop top-to-bottom order.
              order: Math.round(el.y),
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
