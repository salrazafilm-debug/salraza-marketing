"use client";

import { createContext, useContext, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from "react";
import { SECTION_LIBRARY, type Entrance, type Placement, type Section } from "./layout-types";

type EditApi = {
  editing: boolean;
  /** "Move & resize" mode: elements can be dragged and scaled instead of typed in. */
  moveMode: boolean;
  setText: (sectionId: string, key: string, value: string) => void;
  setPlace: (sectionId: string, elId: string, place: Placement | null) => void;
};

const EditContext = createContext<EditApi>({ editing: false, moveMode: false, setText: () => {}, setPlace: () => {} });

export function EditProvider({ value, children }: { value: EditApi; children: ReactNode }) {
  return <EditContext.Provider value={value}>{children}</EditContext.Provider>;
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
export function Txt({ s, k, as: Tag = "span", className = "" }: { s: Section; k: string; as?: ElementType; className?: string }) {
  const { editing, moveMode, setText } = useContext(EditContext);
  const value = textOf(s, k);
  if (!editing || moveMode) return <Tag className={className}>{value}</Tag>;
  return (
    <Tag
      className={`${className} cursor-text rounded-sm outline-dashed outline-1 outline-offset-4 outline-transparent transition-[outline-color] hover:outline-spark/70 focus:outline-spark`}
      contentEditable
      suppressContentEditableWarning
      spellCheck
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
 * A block that can be dragged and resized in the editor's "Move & resize"
 * mode. The offset and size apply on screens 768px and wider; on phones the
 * page keeps its normal stacked layout so nothing ends up off screen.
 * Double-click an element in move mode to put it back where it was.
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
  const { editing, moveMode, setPlace } = useContext(EditContext);
  const saved = s.place?.[id];
  const [live, setLive] = useState<Placement | null>(null);
  const drag = useRef<{ kind: "move" | "resize"; x: number; y: number; start: Placement; w: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const cur = live ?? saved ?? { x: 0, y: 0, scale: 1 };

  const style: CSSProperties | undefined =
    saved || live
      ? ({ ["--mx" as string]: `${cur.x}px`, ["--my" as string]: `${cur.y}px`, ["--ms" as string]: cur.scale } as CSSProperties)
      : undefined;
  const cls = `${className} md:[translate:var(--mx,0px)_var(--my,0px)] md:[scale:var(--ms,1)]`;

  if (!editing || !moveMode) {
    return (
      <div className={cls} style={style}>
        {children}
      </div>
    );
  }

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const kind = (e.target as HTMLElement).dataset.handle === "resize" ? "resize" : "move";
    drag.current = { kind, x: e.clientX, y: e.clientY, start: cur, w: ref.current?.offsetWidth || 300 };
    e.currentTarget.setPointerCapture(e.pointerId);
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
      className={`${cls} relative cursor-move touch-none outline-dashed outline-2 outline-offset-4 outline-[#f5c84c]/70 hover:outline-[#f5c84c]`}
      style={style}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={() => setPlace(s.id, id, null)}
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
