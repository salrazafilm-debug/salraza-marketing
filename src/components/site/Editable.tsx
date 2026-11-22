"use client";

import { createContext, useContext, type ElementType } from "react";
import { SECTION_LIBRARY, type Section } from "./layout-types";

type EditApi = { editing: boolean; setText: (sectionId: string, key: string, value: string) => void };

const EditContext = createContext<EditApi>({ editing: false, setText: () => {} });

export function EditProvider({ value, children }: { value: EditApi; children: React.ReactNode }) {
  return <EditContext.Provider value={value}>{children}</EditContext.Provider>;
}

export function useEditing() {
  return useContext(EditContext).editing;
}

/** The section's saved words for `k`, or the design's default words. */
export function textOf(s: Section, k: string) {
  return s.text[k] ?? SECTION_LIBRARY[s.type].defaults[k] ?? "";
}

/**
 * One editable piece of text. On the live site it's plain text; inside the
 * admin site editor it becomes click-to-edit (saved into the layout on blur).
 */
export function Txt({ s, k, as: Tag = "span", className = "" }: { s: Section; k: string; as?: ElementType; className?: string }) {
  const { editing, setText } = useContext(EditContext);
  const value = textOf(s, k);
  if (!editing) return <Tag className={className}>{value}</Tag>;
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
