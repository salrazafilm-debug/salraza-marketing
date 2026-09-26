"use client";

import { useContext, type ReactNode } from "react";
import { RevealContext } from "@/components/MarksmenVaultIntro";

/** Milliseconds of stagger between each section's build-in animation. */
const STEP_DELAY_MS = 130;

/**
 * Fades and slides a section into place, staggered by `index`. Outside of
 * MarksmenVaultIntro's Provider, RevealContext defaults to true, so this is
 * a no-op (instantly visible) for every client's vault page.
 */
export function RevealSection({ index, children }: { index: number; children: ReactNode }) {
  const revealed = useContext(RevealContext);

  return (
    <div
      className={`transition-all duration-700 ease-out ${
        revealed ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      }`}
      style={{ transitionDelay: `${index * STEP_DELAY_MS}ms` }}
    >
      {children}
    </div>
  );
}
