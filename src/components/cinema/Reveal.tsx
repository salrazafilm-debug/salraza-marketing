"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

/** Rises and fades in once ~20% of it is on screen (styles in globals.css). */
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
      data-reveal=""
      data-in={inView ? "" : undefined}
      style={{ transitionDelay: `${delay}ms` }}
      className={className}
    >
      {children}
    </Tag>
  );
}

/** Live HH:MM:SS clock. */
export function useClock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const f = () => setTime(new Date().toLocaleTimeString("en-GB", { hour12: false }));
    const first = setTimeout(f, 0);
    const id = setInterval(f, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);
  return time;
}
