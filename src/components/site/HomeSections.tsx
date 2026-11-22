"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useRef, type CSSProperties, type ReactNode } from "react";
import { Hero } from "@/components/cinema/Hero";
import { Showcases } from "@/components/cinema/Showcases";
import { Reveal } from "@/components/cinema/Reveal";
import { ElementsLayer, EntranceContext, Movable, Txt, textOf, useEdit, useEditing } from "./Editable";
import { SECTION_LIBRARY, imagesOf, styleOf, type HomeLayout, type Section, type Theme } from "./layout-types";

export type Slots = { gallery: ReactNode; quote: ReactNode };

/* ---------- site-wide colour theme ---------- */

/** Applies the chosen accent / spark colours to everything inside it. */
export function ThemeScope({ theme, children }: { theme?: Theme; children: ReactNode }) {
  if (!theme || (!theme.accent && !theme.accentBright && !theme.spark)) return <>{children}</>;
  const style = {
    ...(theme.accent ? { ["--theme-accent" as string]: theme.accent } : {}),
    ...(theme.accentBright ? { ["--theme-accent-bright" as string]: theme.accentBright } : {}),
    ...(theme.spark ? { ["--theme-spark" as string]: theme.spark, ["--theme-spark-light" as string]: theme.spark } : {}),
  } as CSSProperties;
  return <div style={style}>{children}</div>;
}

/* ---------- section frame: background, height, grain, animation, hover ---------- */

function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Wraps one section and applies the style chosen in the editor. Text colour
 * flips automatically (light text on dark backgrounds) so words stay readable.
 *
 * The background lives on its own clipped layer, so the section's content and
 * any free elements are never clipped: they can overhang into the next
 * section and sit on top of its background. Layers: background (lowest) →
 * z 1-2 behind content → content (z 3) → z 4+ in front. */
/** True when the section paints its own background (anything but the page itself). */
export function hasOwnBg(s: Section) {
  return !!styleOf(s).bg && styleOf(s).bg !== "page";
}

export function SectionFrame({
  s,
  children,
  fadeOut = false,
  plain = false,
}: {
  s: Section;
  children: ReactNode;
  fadeOut?: boolean;
  /** Page-wide smooth background: skip this section's own colour. */
  plain?: boolean;
}) {
  const st = plain ? { ...styleOf(s), bg: undefined } : styleOf(s);
  const { editing, selSection, setFixedH, zoom, moveMode, sel } = useEdit();
  // Layout guides: a grid plus a centre line while arranging things in this section.
  const guides = editing && (moveMode || sel?.sectionId === s.id) && selSection === s.id;
  let mode: "light" | "dark" | undefined;
  let background: string | undefined;
  const cls: string[] = [];

  if (st.bg === "dark" || st.bg === "light") {
    mode = st.bg;
    background = "var(--paper)";
  } else if (st.bg === "color") {
    const c = st.color1 ?? "#8e1b3a";
    background = c;
    mode = luminance(c) < 0.35 ? "dark" : "light";
  } else if (st.bg === "gradient") {
    const c1 = st.color1 ?? "#8e1b3a";
    const c2 = st.color2 ?? "#160b0d";
    background = `linear-gradient(${st.angle ?? 160}deg, ${c1}, ${c2})`;
    mode = (luminance(c1) + luminance(c2)) / 2 < 0.35 ? "dark" : "light";
  }
  if (background) cls.push("text-ink");
  if (st.height === "flat") cls.push("sec-flat");
  if (st.height === "tight") cls.push("sec-tight");
  if (st.height === "roomy") cls.push("sec-roomy");
  if (st.height === "screen") cls.push("sec-screen");
  // An exact height is a desktop layout tool; phones always size to their content.
  if (st.fixedH) cls.push("sec-fixed md:h-[var(--fixed-h)]");
  // A set height crops whatever doesn't fit (unless "let things spill out" is on),
  // so a shortened section never runs into the next one.
  // Nothing is cropped any more: cropping made text that reached past the
  // edge look as if it were hidden behind the next section.
  const crop = false;
  if (st.hover && st.hover !== "none") cls.push(`fx-${st.hover}`);

  // Drag the bottom edge to set an exact height (editor only).
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ y: number; h: number } | null>(null);
  const showHandle = editing;
  const handleActive = selSection === s.id;
  // A piece sent to the very front lifts this whole section above the next one,
  // so it can overlap neighbouring sections without being hidden.
  const raised = Object.values(s.place ?? {}).some((p) => !p.hidden && (p.z ?? 0) >= 20);

  return (
    <div
      ref={ref}
      data-mode={mode}
      data-sec={s.id}
      className={`group/sec relative ${cls.join(" ")}`}
      style={{ containerType: "inline-size", ...(st.fixedH ? { ["--fixed-h" as string]: `${st.fixedH}px` } : {}) } as CSSProperties}
    >
      {background && (
        // Auto blend: the background reaches up over the section above and fades
        // in, so neighbouring colours always melt into each other (no seams). It
        // only fades out at the bottom when the next section has no background.
        <div
          aria-hidden
          className={`${fadeOut ? "blend-both" : "blend-top"} pointer-events-none absolute inset-x-0 bottom-0 overflow-hidden ${st.grain ? "vintage" : ""}`}
          style={{ background }}
        />
      )}
      <div className={crop ? "relative h-full overflow-hidden" : "contents"}>
        <div className={`relative ${raised ? "z-[45]" : "z-[3]"}`}>
          <EntranceContext.Provider value={st.entrance ?? "rise"}>{children}</EntranceContext.Provider>
        </div>
        <ElementsLayer s={s} />
      </div>
      {guides && (
        <div aria-hidden className="edit-guides pointer-events-none absolute inset-0 z-[55]">
          <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-[#ff3d7f]" />
          <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[#ff3d7f]/50" />
        </div>
      )}
      {showHandle && (
        <div
          data-mode="dark"
          className={`absolute inset-x-0 bottom-0 z-[60] flex h-4 cursor-ns-resize items-center justify-center bg-[#f5c84c]/25 transition-opacity hover:bg-[#f5c84c]/50 ${
            handleActive ? "opacity-100" : "opacity-0 group-hover/sec:opacity-100"
          }`}
          title="Drag to set this section's height · double-click for automatic height"
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            drag.current = { y: e.clientY, h: ref.current?.offsetHeight ?? 400 };
            try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
          }}
          onPointerMove={(e) => {
            if (!drag.current) return;
            const raw = drag.current.h + (e.clientY - drag.current.y) / zoom;
            const h = Math.max(16, Math.min(3000, e.altKey ? raw : Math.round(raw / 8) * 8));
            setFixedH(s.id, h);
          }}
          onPointerUp={() => (drag.current = null)}
          onPointerCancel={() => (drag.current = null)}
          onDoubleClick={() => setFixedH(s.id, null)}
        >
          <span className="rounded-full bg-[#f5c84c] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black">
            ↕ {st.fixedH ? `${st.fixedH}px` : "auto height"} · drag
          </span>
        </div>
      )}
    </div>
  );
}

/* ---------- sections ---------- */

function Eyebrow({ s, k = "eyebrow" }: { s: Section; k?: string }) {
  return <Txt s={s} k={k} as="p" className="block text-xs uppercase tracking-[0.3em] text-warm-text" />;
}

function Statement({ s }: { s: Section }) {
  return (
    <section className="relative">
      <div className="relative mx-auto max-w-5xl px-6 py-24 text-center sm:py-32">
        <Movable s={s} id="eyebrow" label="Small label">
          <Reveal>
            <Eyebrow s={s} />
          </Reveal>
        </Movable>
        <Movable s={s} id="headline" label="Headline">
          <Reveal as="h2" delay={100} className="mt-6 font-display text-3xl font-black uppercase leading-[1.05] sm:text-6xl">
            <Txt s={s} k="part1" className="text-accent-bright" /> <Txt s={s} k="part2" className="title-lit" />{" "}
            <Txt s={s} k="part3" className="text-spark" />
          </Reveal>
        </Movable>
      </div>
    </section>
  );
}

function About({ s }: { s: Section }) {
  return (
    <section id="about" className="relative px-4 py-24 sm:px-6 sm:py-28">
      <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
        <Movable s={s} id="heading" label="Heading">
          <Reveal>
            <Eyebrow s={s} />
          </Reveal>
          <Reveal delay={80}>
            <Txt s={s} k="title" as="h2" className="title-lit mt-4 block font-display text-4xl font-black uppercase sm:text-6xl" />
          </Reveal>
        </Movable>
        <Movable s={s} id="body" label="Paragraph">
          <Reveal delay={160}>
            <Txt s={s} k="body" as="p" className="block max-w-xl text-base text-ink/85 sm:text-lg" />
          </Reveal>
        </Movable>
        <Movable s={s} id="signatures" label="Signatures">
          <Reveal delay={240} className="mt-4 flex items-center gap-6 sm:gap-10">
            <img
              src="/signatures/bruce-signature.png"
              alt="Bruce's signature"
              className="h-auto w-24 invert mix-blend-screen light:invert-0 light:mix-blend-multiply sm:w-40"
            />
            <img
              src="/signatures/elena-signature-clear.webp"
              alt="Elena's signature"
              className="h-auto w-32 invert light:invert-0 sm:w-[213px]"
            />
          </Reveal>
        </Movable>
      </div>
    </section>
  );
}

function Gallery({ s, slot }: { s: Section; slot: ReactNode }) {
  return (
    <section className="px-4 py-24 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-[1200px]">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <Movable s={s} id="heading" label="Heading">
            <Reveal>
              <Eyebrow s={s} />
            </Reveal>
            <Reveal delay={80}>
              <Txt s={s} k="title" as="h2" className="title-lit mt-4 block font-display text-4xl font-black uppercase sm:text-6xl" />
            </Reveal>
          </Movable>
          <Link
            href="/portfolio"
            className="focus-brand w-fit rounded-full border border-ink/30 px-6 py-3 text-xs font-bold uppercase tracking-[0.15em] text-ink transition-colors hover:border-accent-bright hover:text-accent-bright"
          >
            <Txt s={s} k="link" />
          </Link>
        </div>
        <Movable s={s} id="grid" label="Photo grid" className="mt-12">
          {slot}
        </Movable>
      </div>
    </section>
  );
}

/** The Media Vault: one small, simple card. Solid colour with plain white text
 * so it reads easily and stands out; a soft glow blends its edges into the page. */
function Vault({ s }: { s: Section }) {
  return (
    <section id="vault" className="relative px-4 py-20 sm:px-6 sm:py-28">
      <Movable s={s} id="card" label="Media Vault" className="mx-auto max-w-[720px]">
        <Reveal>
          <div
            data-mode="dark"
            className="relative rounded-3xl px-6 py-12 text-center sm:px-14 sm:py-16"
            style={{
              background: "linear-gradient(180deg, #4a1730 0%, #36111f 100%)",
              // Soft glow around the card so its edges melt into the page.
              boxShadow: "0 0 0 1px rgba(245,200,76,.35), 0 0 70px 14px rgba(142,27,58,.55), 0 40px 90px -30px rgba(0,0,0,.85)",
            }}
          >
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#f5c84c]/60 text-[#f5c84c]">
              <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
                <rect x="4" y="9" width="12" height="9" rx="2" />
                <path d="M7 9V6a3 3 0 0 1 6 0v3" />
              </svg>
            </span>
            <Txt s={s} k="eyebrow" as="p" className="mt-6 block text-xs uppercase tracking-[0.3em] text-white" />
            <h2 className="mt-3 font-display text-3xl font-black uppercase leading-[1] text-white sm:text-5xl">
              <Txt s={s} k="title" /> <Txt s={s} k="titleSpark" />
            </h2>
            <Txt s={s} k="body" as="p" className="mx-auto mt-5 block max-w-md text-base text-white sm:text-lg" />
            <Link
              href="/clients"
              className="focus-brand mt-8 inline-flex items-center gap-3 rounded-full bg-[#f5c84c] px-8 py-4 text-xs font-bold uppercase tracking-[0.15em] text-[#160b0d] transition duration-300 hover:-translate-y-0.5 hover:bg-white"
            >
              <Txt s={s} k="cta" />
              <span aria-hidden>→</span>
            </Link>
          </div>
        </Reveal>
      </Movable>
    </section>
  );
}

function Quote({ s, slot }: { s: Section; slot: ReactNode }) {
  return (
    <section id="quote" className="px-4 py-24 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-[900px]">
        <Movable s={s} id="heading" label="Heading" className="text-center">
          <Reveal>
            <Eyebrow s={s} />
          </Reveal>
          <Reveal delay={80}>
            <Txt s={s} k="title" as="h2" className="title-lit mt-4 block font-display text-4xl font-black uppercase sm:text-6xl" />
          </Reveal>
          <Txt s={s} k="body" as="p" className="mx-auto mt-4 block max-w-lg text-base text-ink-muted sm:text-lg" />
        </Movable>
        <Movable s={s} id="form" label="Form" className="mt-12">
          <div
            data-mode="light"
            className="relative overflow-hidden rounded-2xl bg-[#fbf7f2] p-4 text-ink shadow-[0_50px_100px_-40px_rgba(20,4,10,.75)] ring-1 ring-black/5 sm:p-8"
          >
            {slot}
          </div>
        </Movable>
      </div>
    </section>
  );
}

function TextBlock({ s }: { s: Section }) {
  return (
    <section className="px-4 py-20 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-3xl">
        <Movable s={s} id="heading" label="Heading">
          <Reveal>
            <Eyebrow s={s} />
          </Reveal>
          <Reveal delay={80}>
            <Txt s={s} k="title" as="h2" className="title-lit mt-4 block font-display text-3xl font-black uppercase sm:text-5xl" />
          </Reveal>
        </Movable>
        <Movable s={s} id="body" label="Paragraph">
          <Reveal delay={160}>
            <Txt s={s} k="body" as="p" className="mt-5 block whitespace-pre-line text-base text-ink/85 sm:text-lg" />
          </Reveal>
        </Movable>
      </div>
    </section>
  );
}

function Banner({ s }: { s: Section }) {
  return (
    <section className="relative px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-4xl text-center">
        <Movable s={s} id="quote" label="Quote">
          <Reveal>
            <Txt s={s} k="quote" as="p" className="block font-script text-4xl leading-tight text-ink sm:text-6xl" />
          </Reveal>
        </Movable>
        <Movable s={s} id="caption" label="Caption">
          <Reveal delay={120}>
            <Txt s={s} k="caption" as="p" className="mt-6 block text-xs uppercase tracking-[0.3em] text-warm-text" />
          </Reveal>
        </Movable>
      </div>
    </section>
  );
}

function ImageText({ s }: { s: Section }) {
  const img = imagesOf(s, "main")[0];
  return (
    <section className="px-4 py-20 sm:px-6 sm:py-24">
      <div className="mx-auto grid max-w-[1200px] items-center gap-10 md:grid-cols-2 md:gap-16">
        <Movable s={s} id="image" label="Photo">
          <Reveal>
            <div className="overflow-hidden rounded-xl shadow-[0_30px_60px_-30px_rgba(40,8,20,.6)]">
              {img && <img src={img} alt="" className="aspect-[4/5] w-full object-cover" />}
            </div>
          </Reveal>
        </Movable>
        <Movable s={s} id="text" label="Text">
          <Reveal delay={100}>
            <Eyebrow s={s} />
            <Txt s={s} k="title" as="h2" className="title-lit mt-4 block font-display text-3xl font-black uppercase sm:text-5xl" />
            <Txt s={s} k="body" as="p" className="mt-5 block whitespace-pre-line text-base text-ink/85 sm:text-lg" />
            <Link
              href="/#quote"
              className="focus-brand mt-8 inline-block rounded-full bg-spark px-7 py-3.5 text-xs font-bold uppercase tracking-[0.15em] text-[#160b0d] transition-colors hover:bg-accent hover:text-white"
            >
              <Txt s={s} k="cta" />
            </Link>
          </Reveal>
        </Movable>
      </div>
    </section>
  );
}

function Testimonials({ s }: { s: Section }) {
  return (
    <section className="px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-[1200px]">
        <Movable s={s} id="heading" label="Heading" className="text-center">
          <Reveal>
            <Eyebrow s={s} />
          </Reveal>
          <Reveal delay={80}>
            <Txt s={s} k="title" as="h2" className="title-lit mt-4 block font-display text-3xl font-black uppercase sm:text-5xl" />
          </Reveal>
        </Movable>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {[1, 2, 3].map((n, i) => (
            <Movable key={n} s={s} id={`card${n}`} label={`Quote ${n}`}>
              <Reveal delay={i * 100} className="h-full rounded-xl border border-line bg-paper-raised/60 p-7">
                <span className="font-display text-4xl leading-none text-spark">“</span>
                <Txt s={s} k={`q${n}`} as="p" className="mt-2 block text-lg text-ink" />
                <Txt s={s} k={`a${n}`} as="p" className="mt-5 block text-xs uppercase tracking-[0.2em] text-warm-text" />
              </Reveal>
            </Movable>
          ))}
        </div>
      </div>
    </section>
  );
}

function Faq({ s }: { s: Section }) {
  const editing = useEditing();
  return (
    <section className="px-4 py-20 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-3xl">
        <Movable s={s} id="heading" label="Heading">
          <Reveal>
            <Eyebrow s={s} />
          </Reveal>
          <Reveal delay={80}>
            <Txt s={s} k="title" as="h2" className="title-lit mt-4 block font-display text-3xl font-black uppercase sm:text-5xl" />
          </Reveal>
        </Movable>
        <div className="mt-10 divide-y divide-line border-y border-line">
          {[1, 2, 3, 4].map((n) => (
            <details key={n} className="group py-5" open={editing || undefined}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-bold text-ink">
                <Txt s={s} k={`fq${n}`} />
                <span className="text-spark transition-transform group-open:rotate-45">+</span>
              </summary>
              <Txt s={s} k={`fa${n}`} as="p" className="mt-3 block text-base text-ink-muted" />
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function embedUrl(url: string): string | null {
  const yt = /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/.exec(url);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`;
  const vm = /vimeo\.com\/(\d+)/.exec(url);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return null;
}

function Video({ s }: { s: Section }) {
  const editing = useEditing();
  const src = embedUrl(textOf(s, "url"));
  return (
    <section className="px-4 py-20 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-[1000px]">
        <Movable s={s} id="heading" label="Heading">
          <Reveal>
            <Eyebrow s={s} />
          </Reveal>
          <Reveal delay={80}>
            <Txt s={s} k="title" as="h2" className="title-lit mt-4 block font-display text-3xl font-black uppercase sm:text-5xl" />
          </Reveal>
        </Movable>
        {editing && (
          <p className="mt-6 text-xs text-ink-muted">
            Video link (YouTube or Vimeo): <Txt s={s} k="url" className="font-mono text-ink" />
          </p>
        )}
        <Movable s={s} id="player" label="Video" className="mt-8">
          <div className="aspect-video overflow-hidden rounded-xl bg-black shadow-[0_30px_60px_-30px_rgba(0,0,0,.7)]">
            {src ? (
              <iframe
                src={src}
                title={textOf(s, "title")}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            ) : (
              <p className="flex h-full items-center justify-center text-sm text-white/60">Paste a YouTube or Vimeo link</p>
            )}
          </div>
        </Movable>
      </div>
    </section>
  );
}

function renderSection(s: Section, slots: Slots) {
  switch (s.type) {
    case "hero":
      return <Hero s={s} />;
    case "statement":
      return <Statement s={s} />;
    case "showcases":
      return <Showcases s={s} />;
    case "about":
      return <About s={s} />;
    case "gallery":
      return <Gallery s={s} slot={slots.gallery} />;
    case "vault":
      return <Vault s={s} />;
    case "quote":
      return <Quote s={s} slot={slots.quote} />;
    case "textBlock":
      return <TextBlock s={s} />;
    case "banner":
      return <Banner s={s} />;
    case "imageText":
      return <ImageText s={s} />;
    case "testimonials":
      return <Testimonials s={s} />;
    case "faq":
      return <Faq s={s} />;
    case "video":
      return <Video s={s} />;
    case "blank":
      // Empty canvas: only free elements (added in the editor) and the set height.
      return <section aria-label="" className="min-h-[1px]" />;
  }
}

export type CanvasControls = { selectedId: string | null; select: (id: string) => void };

/** Renders the homepage from its layout. With `canvas`, sections become
 * selectable for the admin editor (hidden ones are shown faded). */
export function HomeSections({ layout, slots, canvas }: { layout: HomeLayout; slots: Slots; canvas?: CanvasControls }) {
  const list = canvas ? layout.sections : layout.sections.filter((s) => !s.hidden);
  const nodes = list.map((s, i) => {
        const next = list.slice(i + 1).find((n) => canvas || !n.hidden);
        const plain = !!layout.smoothBg;
        const fadeOut = !plain && hasOwnBg(s) && (!next || !hasOwnBg(next));
        return canvas ? (
          <div
            key={s.id}
            id={`sec-${s.id}`}
            onPointerDownCapture={() => canvas.select(s.id)}
            className={`relative scroll-mt-24 ${
              canvas.selectedId === s.id ? "outline outline-2 -outline-offset-2 outline-[#f5c84c]" : "hover:outline hover:outline-1 hover:-outline-offset-1 hover:outline-[#f5c84c]/50"
            }`}
          >
            {canvas.selectedId === s.id && (
              <span className="pointer-events-none absolute left-3 top-3 z-40 rounded bg-[#f5c84c] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black">
                {SECTION_LIBRARY[s.type].label}
              </span>
            )}
            {s.hidden && (
              <span className="pointer-events-none absolute right-3 top-3 z-40 rounded bg-[#8e1b3a] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                Hidden on live site
              </span>
            )}
            <div className={s.hidden ? "opacity-40 grayscale" : undefined}>
              <SectionFrame s={s} fadeOut={fadeOut} plain={plain}>{renderSection(s, slots)}</SectionFrame>
            </div>
          </div>
        ) : (
          <SectionFrame key={s.id} s={s} fadeOut={fadeOut} plain={plain}>
            {renderSection(s, slots)}
          </SectionFrame>
        );
      });
  // Dusk to dawn: the top of the page (bar and hero) stays dark; from "What we
  // do" down the page brightens through rose and peach into warm cream.
  const cut = list.findIndex((s) => s.type === "showcases");
  const at = cut >= 0 ? cut : Math.min(1, nodes.length);
  return (
    <ThemeScope theme={layout.theme}>
      {nodes.slice(0, at)}
      {nodes.length > at && (
        <div className="dawn relative text-ink">
          {nodes.slice(at).map((node, i) => {
            // After "What we do": the next section sits on paper, the one after
            // on a dark band, and so on, so the page alternates like an oreo.
            const s = list[at + i];
            const dark = s.type !== "showcases" && i % 2 === 0;
            return dark ? (
              <div key={s.id} data-mode="dark" className="band-dark relative text-ink">
                {node}
              </div>
            ) : (
              node
            );
          })}
        </div>
      )}
    </ThemeScope>
  );
}
