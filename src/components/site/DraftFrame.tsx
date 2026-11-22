"use client";

import { useSyncExternalStore } from "react";
import { HomeSections, type Slots } from "./HomeSections";
import { parseLayout, type HomeLayout } from "./layout-types";

const DRAFT_KEY = "salraza-homepage-draft";

function subscribe(cb: () => void) {
  // The editor (parent window) writes the draft to sessionStorage; the
  // "storage" event fires here in the frame, and "salraza-draft" covers the
  // same-document case.
  window.addEventListener("storage", cb);
  window.parent?.addEventListener("salraza-draft", cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.parent?.removeEventListener("salraza-draft", cb);
  };
}
const read = () => {
  try {
    return sessionStorage.getItem(DRAFT_KEY) ?? "";
  } catch {
    return "";
  }
};

/** Phone preview inside the editor: shows the unsaved draft, live. */
export function DraftFrame({ saved, slots }: { saved: HomeLayout; slots: Slots }) {
  const raw = useSyncExternalStore(subscribe, read, () => "");
  let layout = saved;
  if (raw) {
    try {
      layout = parseLayout(JSON.parse(raw)) ?? saved;
    } catch {}
  }
  return <HomeSections layout={layout} slots={slots} />;
}
