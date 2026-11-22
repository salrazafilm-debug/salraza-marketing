"use client";

import { useClock } from "./Reveal";

/** Fixed bottom bar: blinking REC dot on the left, live clock on the right. */
export function RecBar() {
  const clock = useClock();
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-between px-5 pb-4 text-[11px] tracking-[0.2em] text-ink sm:px-10 sm:pb-5 sm:text-xs">
      <span className="flex items-center gap-2 rounded-full bg-paper/85 px-3 py-1">
        <span className="rec-blink h-2 w-2 rounded-full bg-accent-bright shadow-[0_0_8px_var(--accent-bright)]" /> REC
      </span>
      <span className="rounded-full bg-paper/85 px-3 py-1 tabular-nums">{clock}</span>
    </div>
  );
}
