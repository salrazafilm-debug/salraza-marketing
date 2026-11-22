"use client";

import { useEffect, useRef } from "react";

type Pt = { x: number; y: number; t: number };

export type ScribbleStyle = {
  colors: string[];
  width: number;
  /** How long a stroke stays before it fades out (ms). */
  life: number;
  /** Hand-drawn wobble in px. */
  wobble: number;
  /** "chalk" breaks the line into dusty dashes. */
  texture?: "smooth" | "chalk";
  glow?: number;
};

/**
 * Draws fading hand-drawn strokes that follow the cursor while it is near the
 * element this canvas covers. With no cursor (phones, or the mouse resting),
 * an invisible "pen" loops around the centre so the scribbles still play.
 */
export function ScribbleCanvas({ style, className = "" }: { style: ScribbleStyle; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = canvas.getBoundingClientRect();
      w = r.width;
      h = r.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const strokes: { pts: Pt[]; color: string; seed: number }[] = [];
    let current: { pts: Pt[]; color: string; seed: number } | null = null;
    let colorIndex = 0;
    let lastPointer = 0;

    const newStroke = () => {
      current = { pts: [], color: style.colors[colorIndex++ % style.colors.length], seed: Math.random() * 1000 };
      strokes.push(current);
    };

    const addPoint = (x: number, y: number) => {
      const now = performance.now();
      if (!current || current.pts.length > 70) newStroke();
      const last = current!.pts[current!.pts.length - 1];
      if (last && Math.hypot(last.x - x, last.y - y) < 4) return;
      current!.pts.push({ x, y, t: now });
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      if (x < 0 || y < 0 || x > r.width || y > r.height) {
        current = null;
        return;
      }
      lastPointer = performance.now();
      addPoint(x, y);
    };
    window.addEventListener("pointermove", onMove);

    let raf = 0;
    let visible = true;
    let autoT = Math.random() * 10;
    const draw = (now: number) => {
      // Autopilot: a looping, slightly irregular orbit around the centre.
      if (!reduce && now - lastPointer > 1800) {
        autoT += 0.022;
        const x = w / 2 + Math.cos(autoT) * w * 0.36 + Math.sin(autoT * 2.7) * w * 0.06;
        const y = h / 2 + Math.sin(autoT * 1.3) * h * 0.34 + Math.cos(autoT * 3.1) * h * 0.08;
        addPoint(x, y);
      }

      ctx.clearRect(0, 0, w, h);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (let s = strokes.length - 1; s >= 0; s--) {
        const st = strokes[s];
        st.pts = st.pts.filter((p) => now - p.t < style.life);
        if (st.pts.length === 0 && st !== current) {
          strokes.splice(s, 1);
          continue;
        }
        for (let i = 1; i < st.pts.length; i++) {
          const a = st.pts[i - 1];
          const b = st.pts[i];
          const age = (now - b.t) / style.life;
          const alpha = Math.max(0, 1 - age);
          const j = (n: number) => Math.sin(n * 12.9898 + st.seed) * style.wobble;
          ctx.globalAlpha = alpha;
          ctx.strokeStyle = st.color;
          ctx.lineWidth = style.width * (0.7 + 0.3 * alpha);
          if (style.texture === "chalk") ctx.setLineDash([style.width * 1.4, style.width * 0.9]);
          else ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(a.x + j(i), a.y + j(i + 7));
          ctx.quadraticCurveTo(a.x, a.y, (a.x + b.x) / 2 + j(i + 3), (a.y + b.y) / 2 + j(i + 5));
          ctx.lineTo(b.x + j(i + 1), b.y + j(i + 9));
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      // Keep looping only while the canvas is on screen.
      raf = visible ? requestAnimationFrame(draw) : 0;
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(draw);
    });
    io.observe(canvas);
    raf = requestAnimationFrame(draw);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
    };
  }, [style]);

  return <canvas ref={ref} aria-hidden className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} />;
}
