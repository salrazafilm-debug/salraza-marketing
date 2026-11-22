"use client";

import { useContext, useEffect, useRef, useState, type ElementType, type ReactNode } from "react";
import { EntranceContext } from "@/components/site/Editable";

/**
 * Animates in once ~20% of it is on screen. The animation (rise, fade, zoom,
 * slide or none) comes from the section's style; styles live in globals.css.
 */
export function Reveal({
  as: Tag = "div",
  delay = 0,
  className = "",
  children,
}: {
  as?: ElementType;
  delay?: number;
  className?: string;
  children: ReactNode;
}) {
  const entrance = useContext(EntranceContext);
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag
      ref={ref}
      data-reveal={entrance}
      data-in={inView ? "" : undefined}
      style={{ transitionDelay: `${delay}ms` }}
      className={className}
    >
      {children}
    </Tag>
  );
}

/** Live 12-hour clock with seconds, e.g. 2:37:05 PM. */
export function useClock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const f = () =>
      setTime(new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true }));
    const first = setTimeout(f, 0);
    const id = setInterval(f, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);
  return time;
}
