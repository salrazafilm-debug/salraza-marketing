"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef } from "react";
import { PHOTOS } from "./photos";

const BASE_SPEED = 0.55; // px per frame at 60fps
const HOVER_SPEED = BASE_SPEED / 3;

/**
 * Endless photo strip with a gentle concave "cinema screen" depth: photos stay
 * straight and upright, but the ones toward the edges turn slightly toward the
 * viewer and come forward. Hovering a photo enlarges it and eases the whole
 * strip down to a third of its speed (it keeps moving).
 */
export function ReelStrip() {
  const trackRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const hovering = useRef(false);

  useEffect(() => {
    const track = trackRef.current;
    const wrap = wrapRef.current;
    if (!track || !wrap) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cards = Array.from(track.children) as HTMLElement[];
    const inners = cards.map((c) => c.firstElementChild as HTMLElement | null);

    // Measured once (and on resize), not every frame: layout reads inside an
    // animation loop force the browser to recalculate layout 60 times a second.
    let centers: number[] = [];
    let half = 0;
    let vw = window.innerWidth;
    const measure = () => {
      vw = window.innerWidth;
      centers = cards.map((c) => c.offsetLeft + c.offsetWidth / 2);
      half = track.scrollWidth / 2;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);

    let x = 0;
    let speed = BASE_SPEED;
    let last = performance.now();
    let raf = 0;
    let running = false;

    const loop = (now: number) => {
      const dt = Math.min(3, (now - last) / 16.67);
      last = now;
      const target = reduce ? 0 : hovering.current ? HOVER_SPEED : BASE_SPEED;
      speed += (target - speed) * 0.06 * dt;
      x -= speed * dt;
      if (half > 0 && -x >= half) x += half;
      track.style.transform = `translate3d(${x}px,0,0)`;

      for (let i = 0; i < cards.length; i++) {
        const cx = centers[i] + x;
        const inner = inners[i];
        if (!inner || cx < -260 || cx > vw + 260) continue;
        const n = Math.max(-1.3, Math.min(1.3, (cx - vw / 2) / (vw / 2)));
        inner.style.transform = `rotateY(${(-n * 16).toFixed(1)}deg) translateZ(${(Math.abs(n) * 60).toFixed(0)}px)`;
      }
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    // Only animate while the strip is actually on screen.
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { rootMargin: "100px" });
    io.observe(wrap);
    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="relative w-full overflow-hidden py-5 sm:py-7"
      style={{
        perspective: "1400px",
        // Edge fade as a mask, so the strip dissolves into whatever the page
        // background is (no separate coloured overlay to mismatch).
        maskImage: "linear-gradient(to right, transparent 0, #000 11%, #000 89%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to right, transparent 0, #000 11%, #000 89%, transparent 100%)",
      }}
    >
      <div ref={trackRef} className="flex w-max gap-4 will-change-transform sm:gap-6" style={{ transformStyle: "preserve-3d" }}>
        {[...PHOTOS, ...PHOTOS].map((p, i) => (
          <div
            key={i}
            className="shrink-0"
            style={{ transformStyle: "preserve-3d" }}
            onPointerEnter={() => (hovering.current = true)}
            onPointerLeave={() => (hovering.current = false)}
          >
            <figure className="group relative will-change-transform">
              <div className="aspect-[3/4] h-[clamp(190px,34svh,360px)] overflow-hidden shadow-[0_26px_50px_-24px_rgba(60,10,25,.6)] transition-transform duration-500 ease-out group-hover:scale-[1.07]">
                <img
                  src={p.src}
                  alt={i < PHOTOS.length ? p.title : ""}
                  loading={i < 6 ? "eager" : "lazy"}
                  className="h-full w-full object-cover grayscale-[20%] transition duration-500 group-hover:grayscale-0"
                />
              </div>
              <figcaption className="pointer-events-none absolute inset-x-0 bottom-4 flex translate-y-2 justify-center opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                <span className="bg-accent px-2.5 py-1 text-[11px] uppercase tracking-[0.2em] text-white">● {p.title}</span>
              </figcaption>
            </figure>
          </div>
        ))}
      </div>
    </div>
  );
}
