"use client";

import { useSyncExternalStore } from "react";
import { MODE_STORAGE_KEY } from "./mode";

function subscribe(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-mode"] });
  return () => obs.disconnect();
}
const getMode = () => document.documentElement.dataset.mode ?? "light";

/** Sun / moon button that flips light and dark mode and remembers it. */
export function ModeToggle({ className = "" }: { className?: string }) {
  const mode = useSyncExternalStore(subscribe, getMode, () => "light");
  const next = mode === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => {
        document.documentElement.dataset.mode = next;
        try {
          localStorage.setItem(MODE_STORAGE_KEY, next);
        } catch {}
      }}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      className={`focus-brand flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink transition hover:border-spark hover:text-spark ${className}`}
    >
      {mode === "dark" ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="4.5" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
        </svg>
      )}
    </button>
  );
}
