"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef } from "react";
import { PHOTOS } from "./photos";

const SPEED = 34; // pixels per second

/**
 * Endless photo strip. The motion is a Web Animation on the strip's transform,
 * so the browser runs it on the compositor (GPU) thread with no per-frame
 * JavaScript: it stays smooth even when the page is busy. Hovering a photo
 * enlarges it and eases the strip down to a third of its speed (it keeps
 * moving). The strip pauses while it is off screen.
 */
export function ReelStrip({ photos = PHOTOS }: { photos?: { thumb: string; title: string }[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const setHover = useRef<(on: boolean) => void>(() => {});
  // Rebuild the animation only when the chosen photos actually change.
  const sig = photos.map((p) => p.thumb).join("|");
  // Repeat short lists so one loop is always wider than the screen (no gaps).
  const base: { thumb: string; title: string }[] = [];
  while (photos.length && base.length < 10) base.push(...photos);

  useEffect(() => {
    const wrap = wrapRef.current;
    const track = trackRef.current;
    if (!wrap || !track) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let anim: Animation | null = null;
    let visible = true;
    let rate = 1;
    let target = 1;
    let raf = 0;

    const build = () => {
      const half = track.scrollWidth / 2;
      if (!half) return;
      const prev = anim?.effect?.getComputedTiming().progress;
      const progress = typeof prev === "number" ? prev : 0;
      anim?.cancel();
      const duration = (half / SPEED) * 1000;
      anim = track.animate(
        [{ transform: "translate3d(0,0,0)" }, { transform: `translate3d(${-half}px,0,0)` }],
        { duration, iterations: Infinity, easing: "linear" }
      );
      anim.currentTime = progress * duration;
      anim.playbackRate = rate;
      if (reduce || !visible) anim.pause();
    };
    build();
    const ro = new ResizeObserver(build);
    ro.observe(track);

    // Ease the playback rate toward its target (slow on hover, normal otherwise).
    const step = () => {
      rate += (target - rate) * 0.14;
      if (Math.abs(target - rate) < 0.01) rate = target;
      if (anim) anim.playbackRate = rate;
      raf = rate === target ? 0 : requestAnimationFrame(step);
    };
    setHover.current = (on) => {
      target = on ? 1 / 3 : 1;
      if (!raf) raf = requestAnimationFrame(step);
    };

    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        if (!anim || reduce) return;
        if (visible) anim.play();
        else anim.pause();
      },
      { rootMargin: "100px" }
    );
    io.observe(wrap);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      anim?.cancel();
    };
  }, [sig]);

  return (
    <div
      ref={wrapRef}
      className="relative w-full overflow-hidden py-5 sm:py-7"
      style={{
        // Edge fade as a mask, so the strip dissolves into whatever the page
        // background is (no separate coloured overlay to mismatch).
        maskImage: "linear-gradient(to right, transparent 0, #000 9%, #000 91%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to right, transparent 0, #000 9%, #000 91%, transparent 100%)",
      }}
    >
      <div ref={trackRef} className="flex w-max gap-4 will-change-transform sm:gap-6">
        {[...base, ...base].map((p, i) => (
          <figure
            key={i}
            className="group relative shrink-0"
            onPointerEnter={() => setHover.current(true)}
            onPointerLeave={() => setHover.current(false)}
          >
            <div className="aspect-[3/4] h-[clamp(190px,34svh,360px)] overflow-hidden shadow-[0_22px_40px_-22px_rgba(60,10,25,.55)] transition-transform duration-500 ease-out group-hover:scale-[1.06]">
              <img
                src={p.thumb}
                alt={i < photos.length ? p.title : ""}
                decoding="async"
                draggable={false}
                loading={i < 6 ? "eager" : "lazy"}
                className="h-full w-full object-cover"
              />
            </div>
            <figcaption className="pointer-events-none absolute inset-x-0 bottom-4 flex translate-y-2 justify-center opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
              {p.title && <span className="bg-accent px-2.5 py-1 text-[11px] uppercase tracking-[0.2em] text-white">● {p.title}</span>}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
