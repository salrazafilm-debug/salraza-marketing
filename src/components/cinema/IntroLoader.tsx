"use client";

import { useEffect, useState } from "react";

/**
 * The Velvet intro: grain screen, "SALRAZA" in a viewfinder frame, a
 * percentage that follows real image loading (with a minimum duration so it
 * never just flashes), then a textured burgundy wipe reveals the page.
 * Plays every time the homepage loads (with a Skip button); the footer's
 * "Replay intro" plays it again without reloading.
 */
export function IntroLoader({ preload, minMs = 2200 }: { preload: string[]; minMs?: number }) {
  const [pct, setPct] = useState(0);
  const [phase, setPhase] = useState<"loading" | "wipe-in" | "wipe-out" | "done">("loading");
  const [run, setRun] = useState(0);

  // "Replay intro" anywhere on the page fires this event.
  useEffect(() => {
    const replay = () => {
      setPct(0);
      setPhase("loading");
      setRun((r) => r + 1);
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("salraza-replay-intro", replay);
    return () => window.removeEventListener("salraza-replay-intro", replay);
  }, []);

  useEffect(() => {
    const finish = () => setPhase("done");

    let loaded = 0;
    const total = preload.length || 1;
    // Keep references: an unreferenced Image can be garbage-collected before
    // it fires onload, which would leave the counter stuck.
    const imgs = preload.map((src) => {
      const img = new Image();
      img.onload = img.onerror = () => {
        loaded++;
      };
      img.src = src;
      return img;
    });

    const timers: number[] = [];
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const timeP = Math.min(1, (now - start) / minMs);
      const eased = 1 - Math.pow(1 - timeP, 3);
      const p = Math.min(eased, loaded / total + 0.05) * 100;
      setPct((prev) => Math.max(prev, Math.min(100, Math.round(p))));
      // Never hold the visitor longer than ~3x the minimum, even on a slow line.
      if ((timeP >= 1 && loaded >= total) || now - start > minMs * 3) {
        imgs.length = 0;
        setPct(100);
        timers.push(window.setTimeout(() => setPhase("wipe-in"), 250));
        timers.push(window.setTimeout(() => setPhase("wipe-out"), 1000));
        timers.push(window.setTimeout(finish, 1800));
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
  }, [preload, minMs, run]);

  if (phase === "done") return null;

  return (
    <div className="intro-loader fixed inset-0 z-[200]" aria-live="polite" data-mode="dark">
      {phase !== "wipe-out" && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0d090a] text-[#f4efe9]">
          <div aria-hidden className="noise-surface absolute inset-0" />
          <div className="relative flex flex-col items-center gap-6">
            <div className="relative px-10 py-6">
              <Frame />
              <span className="font-display text-2xl font-black tracking-wide sm:text-3xl">SALRAZA</span>
              <span className="rec-blink absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-[#f5c84c] shadow-[0_0_10px_#f5c84c]" />
            </div>
            <div className="font-display text-6xl font-black tabular-nums sm:text-8xl">{pct}%</div>
            <div className="h-px w-56 bg-white/15">
              <div
                className="h-full bg-gradient-to-r from-[#8e1b3a] to-[#f5c84c]"
                style={{ width: `${pct}%`, transition: "width .2s" }}
              />
            </div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-white/50">Loading the reel</p>
          </div>
          <button
            type="button"
            onClick={() => setPhase("done")}
            className="focus-brand absolute bottom-6 right-6 text-xs uppercase tracking-[0.2em] text-white/60 hover:text-white"
          >
            Skip intro
          </button>
        </div>
      )}
      <div
        className="absolute inset-y-0 overflow-hidden"
        style={{
          background: "linear-gradient(100deg,#2a0610 0%,#5c0f24 45%,#8e1b3a 80%,#c2543c 100%)",
          width: phase === "wipe-in" ? "100%" : "0%",
          left: phase === "wipe-out" ? "100%" : "0%",
          transition:
            phase === "wipe-in"
              ? "width 0.75s cubic-bezier(.77,0,.18,1)"
              : phase === "wipe-out"
                ? "left 0.8s cubic-bezier(.77,0,.18,1), width 0.8s cubic-bezier(.77,0,.18,1)"
                : "none",
        }}
      >
        <div className="noise-surface absolute inset-0" />
        {/* soft gold light on the leading edge */}
        <div className="absolute inset-y-0 right-0 w-px bg-[#f5c84c] shadow-[0_0_24px_6px_rgba(245,200,76,.45)]" />
      </div>
    </div>
  );
}

export function Frame({ color = "rgba(255,255,255,.7)", size = "h-6 w-6" }: { color?: string; size?: string }) {
  const c = `absolute ${size}`;
  const b = { borderColor: color };
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0">
      <span className={`${c} left-0 top-0 border-l-2 border-t-2`} style={b} />
      <span className={`${c} right-0 top-0 border-r-2 border-t-2`} style={b} />
      <span className={`${c} bottom-0 left-0 border-b-2 border-l-2`} style={b} />
      <span className={`${c} bottom-0 right-0 border-b-2 border-r-2`} style={b} />
    </span>
  );
}
