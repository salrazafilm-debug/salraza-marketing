"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Reveal } from "./Reveal";
import { photoTitle } from "./photos";
import { Txt, textOf, useEditing } from "@/components/site/Editable";
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

/* ---------- Website creation: three sites in a row, the middle one in front ---------- */
function SiteFan({ images }: { images: string[] }) {
  const [ref, inView] = useInView<HTMLDivElement>(0.25);
  const shots = [images[0], images[1] ?? images[0], images[2] ?? images[0]];
  // Each card is 36% wide, so the middle one overlaps its neighbours by ~4%.
  const spots = ["left-0 z-10", "left-1/2 z-20 -translate-x-1/2 scale-[1.06]", "right-0 z-10"];
  const from = ["translateX(30%)", "translateY(10%)", "translateX(-30%)"];
  return (
    <div ref={ref} className="relative mx-auto aspect-[100/26] w-full max-w-[1100px]">
      {shots.map((src, i) =>
        src ? (
          <div key={i} className={`absolute top-[4%] w-[36%] ${spots[i]}`}>
            <img
              src={src}
              alt=""
              className="aspect-[16/10] w-full rounded-md object-cover object-top shadow-[0_30px_60px_-25px_rgba(0,0,0,.8)] ring-1 ring-white/10 transition-[transform,opacity] duration-[1100ms] ease-[cubic-bezier(.16,1,.3,1)] hover:scale-[1.04]"
              style={{ transform: inView ? "none" : from[i], opacity: inView ? 1 : 0, transitionDelay: `${i === 1 ? 150 : 0}ms` }}
            />
          </div>
        ) : null
      )}
    </div>
  );
}

/* ---------- 02 Photography: photos come out of a pile and lay out in full view ---------- */
function PhotoSpread({ images, look }: { images: string[]; look: "polaroid" | "original" }) {
  const [ref, inView] = useInView<HTMLDivElement>(0.2);
  const shots = images.slice(0, 8).map((url) => ({ src: url, thumb: url, title: photoTitle(url) }));
  const tilt = ["-rotate-2", "rotate-1", "rotate-2", "-rotate-1"];
  return (
    <div ref={ref} className="grid grid-cols-3 gap-2.5 sm:gap-5 md:grid-cols-4 md:gap-6">
      {shots.map((p, i) => {
        const col4 = i % 4;
        const col2 = i % 3;
        // While "in the pile", each photo sits over the middle of its row;
        // once the section is in view it slides out to its own spot.
        const sx4 = `${(1.5 - col4) * 100}%`;
        const sx2 = `${(1 - col2) * 100}%`;
        return (
          <figure
            key={p.src}
            className={`max-md:[--sx:var(--sx2)] md:[--sx:var(--sx4)] ${i >= 6 ? "max-md:hidden" : ""}`}
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
                className={`group relative overflow-hidden rounded-lg shadow-[0_28px_55px_-22px_rgba(0,0,0,.75)] transition-transform duration-500 hover:z-20 hover:scale-[1.04] ${col4 % 2 ? "md:translate-y-6" : ""}`}
              >
                <img src={p.thumb} alt={p.title} className="aspect-[3/4] w-full object-cover" />
              </div>
            ) : (
              <div
                className={`group relative bg-[#f4efe9] p-2 pb-8 shadow-[0_28px_55px_-22px_rgba(0,0,0,.75)] transition-transform duration-500 hover:z-20 hover:!rotate-0 hover:scale-[1.04] sm:p-2.5 sm:pb-10 ${tilt[col4]} ${col4 % 2 ? "md:translate-y-6" : ""}`}
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

/* ---------- Branding: the brand board ---------- */
function BrandBoard({ images }: { images: string[] }) {
  const src = images[0];
  if (!src) return null;
  return (
    <img src={src} alt="" className="max-h-[42vh] w-full md:max-h-[70vh] rounded-lg object-cover shadow-[0_40px_80px_-34px_rgba(0,0,0,.7)] transition-transform duration-700 hover:-translate-y-1.5 hover:rotate-[-1deg]" />
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
  const cls = "font-display text-lg font-black text-ink tabular-nums sm:text-2xl xl:text-3xl";
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

const SIDE: Record<number, (s: Section) => ReactNode> = {
  3: (s) => <BrandBoard images={imagesOf(s, "brand")} />,
  4: (s) => <SocialStats s={s} />,
};

/** Big centred title, like a film chapter card. Long titles get a smaller
 * size so they always fit on at most two lines. */
function ChapterTitle({ s, id }: { s: Section; id: number }) {
  const long = textOf(s, `s${id}title`).length > 13;
  return (
    <Reveal>
      <Txt
        s={s}
        k={`s${id}title`}
        as="h3"
        className={`mx-auto block max-w-[16ch] text-balance text-center font-display font-black uppercase leading-[0.95] text-ink ${
          long ? "text-[clamp(1.6rem,6.2vw,5.25rem)]" : "text-[clamp(1.9rem,7.4vw,6.25rem)]"
        }`}
      />
    </Reveal>
  );
}

function Tagline({ s, k, small }: { s: Section; k: string; small?: boolean }) {
  return (
    <Txt
      s={s}
      k={k}
      as="p"
      className={`block whitespace-pre-line font-display font-black max-md:text-center leading-[1.08] text-ink ${small ? "text-[clamp(1.05rem,2.4vw,2rem)]" : "text-[clamp(1.2rem,4vw,3.25rem)]"}`}
    />
  );
}

export function Showcases({ s }: { s: Section }) {
  const order = showOrderOf(s);
  const look = styleOf(s).photos ?? "polaroid";
  return (
    <section id="services" className="relative">
      <div className="mx-auto max-w-[1200px] px-4 pb-8 pt-16 text-center sm:px-6 sm:pb-12 sm:pt-24">
        <Reveal as="p" className="text-[10px] uppercase tracking-[0.3em] text-warm-text sm:text-xs">
          <Txt s={s} k="eyebrow" />
        </Reveal>
        <Reveal delay={80}>
          <Txt s={s} k="title" as="h2" className="title-lit mx-auto mt-3 block max-w-4xl font-display text-[clamp(2rem,6vw,4.5rem)] font-black uppercase leading-[1.02]" />
        </Reveal>
      </div>

      {order.map((id) => {
        if (id === 2)
          return (
            // Photography: a dark band so the photos pop.
            <div key={id} data-mode="dark" className="relative text-ink">
              <div aria-hidden className="vintage band-fade pointer-events-none absolute inset-0 overflow-hidden bg-paper" />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{ background: "radial-gradient(ellipse 70% 45% at 50% 0%, color-mix(in srgb, var(--accent) 35%, transparent), transparent 70%)" }}
              />
              <div className="relative mx-auto max-w-[1200px] px-4 py-12 sm:px-6 sm:py-20">
                <ChapterTitle s={s} id={id} />
                <div className="mt-6 sm:mt-12">{<PhotoSpread images={imagesOf(s, "photos")} look={look} />}</div>
              </div>
            </div>
          );
        if (id === 1)
          return (
            <div key={id} className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 sm:py-20">
              <ChapterTitle s={s} id={id} />
              <div className="mt-6 sm:mt-12">
                <SiteFan images={imagesOf(s, "site")} />
              </div>
            </div>
          );
        const flip = id === 4;
        return (
          <div key={id} className={`mx-auto max-w-[1200px] px-4 py-12 sm:px-6 sm:py-20 ${flip ? "mt-10 sm:mt-24" : ""}`}>
            <ChapterTitle s={s} id={id} />
            <div className="mt-6 grid items-center gap-6 sm:mt-12 md:grid-cols-[1fr_1.15fr] md:gap-12">
              <Reveal className={flip ? "md:order-2" : ""}>
                <Tagline s={s} k={`s${id}tag`} small={id === 4} />
              </Reveal>
              <Reveal delay={120} className={flip ? "md:order-1" : ""}>
                {SIDE[id](s)}
              </Reveal>
            </div>
          </div>
        );
      })}
      <div className="h-6 sm:h-12" />
    </section>
  );
}
