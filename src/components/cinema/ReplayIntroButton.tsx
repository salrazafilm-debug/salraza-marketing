"use client";

import { usePathname, useRouter } from "next/navigation";

/** Plays the homepage intro again (goes home first when on another page). */
export function ReplayIntroButton() {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        if (pathname === "/") window.dispatchEvent(new Event("salraza-replay-intro"));
        else router.push("/");
      }}
      className="focus-brand w-fit uppercase tracking-[0.2em] transition-colors hover:text-spark"
    >
      ↻ Replay intro
    </button>
  );
}
