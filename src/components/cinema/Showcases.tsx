"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Reveal } from "./Reveal";
import { photoTitle } from "./photos";
import { Movable, Txt, textOf, useEditing } from "@/components/site/Editable";
import { imagesOf, showOrderOf, styleOf, type Section } from "@/components/site/layout-types";

function useInView<T extends Element>(threshold = 0.35) {
  const ref = useRef<T>(null);
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
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, inView] as const;
}

/* ---------- 01 Website creation: a site scrolling inside a browser ---------- */
function WebsiteDemo({ images }: { images: string[] }) {
  return (
    <div className="group relative mx-auto w-full max-w-[520px]">
      <div className="overflow-hidden rounded-xl border border-line bg-paper-raised shadow-[0_40px_80px_-30px_rgba(0,0,0,.7)]">
        <div className="flex items-center gap-2 border-b border-line px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-accent-bright" />
          <span className="h-2.5 w-2.5 rounded-full bg-spark" />
          <span className="h-2.5 w-2.5 rounded-full bg-frost" />
          <span className="ml-3 flex-1 rounded-full bg-paper px-3 py-1 text-[11px] text-ink-muted">yourbrand.com</span>
        </div>
        <div className="relative h-[320px] overflow-hidden sm:h-[360px]">
          <div className="animate-[site-scroll_14s_ease-in-out_infinite] group-hover:[animation-play-state:paused]">
            <div className="bg-[#120c0d] p-6 text-[#f4efe9]">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] opacity-70">
                <span className="font-display font-black">Your brand</span>
                <span>Shop · About · Contact</span>
              </div>
              <p className="mt-10 font-display text-3xl font-black uppercase leading-none">Your name,<br />front and center.</p>
              <span className="mt-5 inline-block rounded-full bg-[#f5c84c] px-4 py-2 text-[10px] font-bold uppercase text-black">Book now</span>
            </div>
            {images[0] && <img src={images[0]} alt="" className="h-40 w-full object-cover" />}
            <div className="grid grid-cols-3 gap-2 bg-[#f6efe6] p-4">
              {images.slice(1, 4).map((url) => (
                <img key={url} src={url} alt="" className="aspect-square w-full object-cover" />
              ))}
            </div>
            <div className="bg-[#8e1b3a] p-6 text-center text-white">
              <p className="font-display text-lg font-black uppercase">Reviews &amp; booking</p>
              <p className="mt-1 text-xs opacity-80">Everything your customers need, in one place.</p>
            </div>
            <div className="bg-[#120c0d] p-6 text-[10px] uppercase tracking-[0.2em] text-white/60">© Your brand</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- 02 Photography: photos come out of a pile and lay out in full view ---------- */
function PhotoSpread({ images, look }: { images: string[]; look: "polaroid" | "original" }) {
  const [ref, inView] = useInView<HTMLDivElement>(0.2);
  const shots = images.slice(0, 8).map((url) => ({ src: url, thumb: url, title: photoTitle(url) }));
  const tilt = ["-rotate-2", "rotate-1", "rotate-2", "-rotate-1"];
  return (
    <div ref={ref} className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
      {shots.map((p, i) => {
        const col4 = i % 4;
        const col2 = i % 2;
        // While "in the pile", each photo sits over the middle of its row;
        // once the section is in view it slides out to its own spot.
        const sx4 = `${(1.5 - col4) * 100}%`;
        const sx2 = `${(0.5 - col2) * 100}%`;
        return (
          <figure
            key={p.src}
            className="max-md:[--sx:var(--sx2)] md:[--sx:var(--sx4)] md:even:translate-y-0"
            style={
              {
                ["--sx2" as string]: sx2,
                ["--sx4" as string]: sx4,
                transform: inView ? "translate(0,0) rotate(0deg)" : "translateX(var(--sx)) rotate(-6deg) scale(.92)",
                opacity: inView ? 1 : 0.9,
                transition: `transform 1.1s cubic-bezier(.16,1,.3,1) ${i * 80}ms, opacity .6s ${i * 80}ms`,
                zIndex: 10 - i,
              } as CSSProperties
            }
          >
            {look === "original" ? (
              // Plain photos: no white frame, no tilt, no caption.
              <div
                className={`group relative overflow-hidden rounded-lg shadow-[0_28px_55px_-22px_rgba(0,0,0,.75)] transition-transform duration-500 hover:z-20 hover:scale-[1.04] ${col4 % 2 ? "md:translate-y-8" : ""}`}
              >
                <img src={p.thumb} alt={p.title} className="aspect-[3/4] w-full object-cover" />
              </div>
            ) : (
              <div
                className={`group relative bg-[#f4efe9] p-2 pb-8 shadow-[0_28px_55px_-22px_rgba(0,0,0,.75)] transition-transform duration-500 hover:z-20 hover:!rotate-0 hover:scale-[1.04] sm:p-2.5 sm:pb-10 ${tilt[col4]} ${col4 % 2 ? "md:translate-y-8" : ""}`}
              >
                <img src={p.thumb} alt={p.title} className="aspect-[3/4] w-full object-cover" />
                {p.title && (
                  <figcaption className="absolute inset-x-0 bottom-1.5 text-center font-script text-base text-black/70 sm:bottom-2.5 sm:text-lg">
                    {p.title}
                  </figcaption>
                )}
              </div>
            )}
          </figure>
        );
      })}
    </div>
  );
}

/* ---------- 03 Branding: three pieces, then the palette ---------- */
function BrandBoard({ images }: { images: string[] }) {
  const pieces = images.slice(0, 3).map((url) => ({ src: url, thumb: url }));
  const tilt = ["-rotate-3", "rotate-0", "rotate-3"];
  return (
    <div className="group mx-auto w-full max-w-[560px]">
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {pieces.map((p, i) => (
          <div
            key={p.src}
            className={`aspect-[3/4] overflow-hidden shadow-[0_26px_50px_-22px_rgba(60,10,25,.6)] transition-transform duration-500 group-hover:-translate-y-2 ${tilt[i]} group-hover:rotate-0`}
          >
            <img src={p.thumb} alt="" className="h-full w-full object-cover" />
          </div>
        ))}
      </div>
      <div className="mt-5 grid h-14 grid-cols-5 gap-2 sm:mt-6 sm:h-16">
        {["#160b0d", "#8e1b3a", "#f5c84c", "#c164fc", "#a8e6ff"].map((col) => (
          <span key={col} className="rounded-md shadow-lg ring-1 ring-black/10 transition-transform duration-500 group-hover:-translate-y-1" style={{ background: col }} />
        ))}
      </div>
    </div>
  );
}

/* ---------- 04 Social media: growth numbers and a line that draws itself ---------- */
/** One stat: counts up from 0 when scrolled into view. The words are editable
 * (for example "+312%" or "1.4M"); the symbol, number and unit are split out. */
function StatValue({ s, k, run }: { s: Section; k: string; run: boolean }) {
  const editing = useEditing();
  const raw = textOf(s, k);
  const m = /^([^\d]*)([\d.,]+)(.*)$/.exec(raw);
  const [v, setV] = useState(0);
  const target = m ? parseFloat(m[2].replace(/,/g, "")) : 0;
  const decimals = m && m[2].includes(".") ? m[2].split(".")[1].length : 0;
  const parsed = m !== null;
  useEffect(() => {
    if (!run || !parsed) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 1800);
      setV(target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, target, parsed]);
  const cls = "font-display text-2xl font-black text-ink tabular-nums sm:text-3xl";
  if (editing || !m) return <Txt s={s} k={k} as="p" className={cls} />;
  return (
    <p className={cls}>
      {m[1]}
      {(run ? v : 0).toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {m[3]}
    </p>
  );
}

function SocialStats({ s }: { s: Section }) {
  const [ref, inView] = useInView<HTMLDivElement>();
  const line = "M0 150 C 40 145, 70 140, 100 128 S 160 120, 190 96 S 250 80, 280 52 S 330 22, 360 10";
  return (
    <div ref={ref} className="mx-auto w-full max-w-[520px] rounded-xl border border-line bg-paper-raised/80 p-6 shadow-[0_40px_80px_-34px_rgba(60,10,25,.55)] sm:p-8">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-ink-muted">
        <Txt s={s} k="statsLabel" />
        <span className="flex items-center gap-2 text-accent-bright">
          <span className="rec-blink h-1.5 w-1.5 rounded-full bg-accent-bright" /> Live
        </span>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-3">
        {[1, 2, 3].map((n) => (
          <div key={n}>
            <StatValue s={s} k={`n${n}value`} run={inView} />
            <Txt s={s} k={`n${n}label`} as="p" className="mt-1 text-[10px] uppercase tracking-[0.15em] text-ink-muted" />
          </div>
        ))}
      </div>
      <svg viewBox="0 0 360 160" className="mt-6 h-40 w-full overflow-visible" aria-hidden>
        <defs>
          <linearGradient id="growth-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#c23a5c" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#c23a5c" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[40, 80, 120].map((y) => (
          <line key={y} x1="0" x2="360" y1={y} y2={y} stroke="currentColor" className="text-line" strokeDasharray="3 5" />
        ))}
        <path d={`${line} L360 160 L0 160 Z`} fill="url(#growth-fill)" style={{ opacity: inView ? 1 : 0, transition: "opacity 1.2s 0.6s" }} />
        <path
          d={line}
          fill="none"
          stroke="#c23a5c"
          strokeWidth="3.5"
          strokeLinecap="round"
          pathLength={1}
          style={{ strokeDasharray: 1, strokeDashoffset: inView ? 0 : 1, transition: "stroke-dashoffset 1.8s cubic-bezier(.16,1,.3,1)" }}
        />
        <circle cx="360" cy="10" r="5" fill="#f5c84c" style={{ opacity: inView ? 1 : 0, transition: "opacity .4s 1.7s" }} />
      </svg>
    </div>
  );
}

/** What each of the four showcases shows (ids stay with their words and photos
 * even when the order changes). */
const ITEMS: Record<number, (s: Section, look: "polaroid" | "original") => ReactNode> = {
  1: (s) => <WebsiteDemo images={imagesOf(s, "site")} />,
  2: (s, look) => <PhotoSpread images={imagesOf(s, "photos")} look={look} />,
  3: (s) => <BrandBoard images={imagesOf(s, "brand")} />,
  4: (s) => <SocialStats s={s} />,
};

function ShowcaseText({ s, id, n }: { s: Section; id: number; n: string }) {
  return (
    <>
      <span className="font-display text-sm text-spark">{n}</span>
      <Txt s={s} k={`s${id}title`} as="h3" className="mt-4 block font-display text-3xl font-black uppercase text-ink sm:text-4xl" />
      <Txt s={s} k={`s${id}line`} as="p" className="mt-4 block max-w-sm text-base text-ink-muted" />
    </>
  );
}

export function Showcases({ s }: { s: Section }) {
  const order = showOrderOf(s);
  const look = styleOf(s).photos ?? "polaroid";
  return (
    <section id="services" className="relative">
      <div className="mx-auto max-w-[1200px] px-4 pb-20 pt-24 sm:px-6 sm:pb-24 sm:pt-28">
        <Movable s={s} id="heading" label="Heading">
          <Reveal as="p" className="text-xs uppercase tracking-[0.3em] text-warm-text">
            <Txt s={s} k="eyebrow" />
          </Reveal>
          <Reveal delay={80}>
            <Txt s={s} k="title" as="h2" className="title-lit mt-4 block max-w-3xl font-display text-4xl font-black uppercase leading-[1.05] sm:text-6xl" />
          </Reveal>
        </Movable>
      </div>

      {order.map((id, pos) => {
        const n = String(pos + 1).padStart(2, "0");
        return id === 2 ? (
          // Photography: a dark full-width band so the photos get the whole
          // width and pop against the light page around it. The dark background
          // and its edge fade live on their own layer so the fade never dims
          // the heading or photos above it.
          <div key={id} data-mode="dark" className="relative text-ink">
            <div aria-hidden className="vintage band-fade pointer-events-none absolute inset-0 overflow-hidden bg-paper" />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{ background: "radial-gradient(ellipse 70% 60% at 50% 0%, color-mix(in srgb, var(--accent) 35%, transparent), transparent 70%)" }}
            />
            <div className="relative mx-auto max-w-[1200px] px-4 py-20 sm:px-6 sm:py-28">
              <Movable s={s} id="text2" label={`Text ${n}`}>
                <Reveal>
                  <ShowcaseText s={s} id={id} n={n} />
                </Reveal>
              </Movable>
              <Movable s={s} id="demo2" label="Photos" className="mt-12 sm:mt-16">
                {ITEMS[id](s, look)}
              </Movable>
            </div>
          </div>
        ) : (
          <div key={id} className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 sm:py-20">
            <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
              <Movable s={s} id={`text${id}`} label={`Text ${n}`} className={pos % 2 ? "lg:order-2" : ""}>
                <Reveal>
                  <ShowcaseText s={s} id={id} n={n} />
                </Reveal>
              </Movable>
              <Movable s={s} id={`demo${id}`} label={`Visual ${n}`} className={pos % 2 ? "lg:order-1" : ""}>
                <Reveal delay={120}>{ITEMS[id](s, look)}</Reveal>
              </Movable>
            </div>
          </div>
        );
      })}
      <div className="h-12 sm:h-16" />
    </section>
  );
}
