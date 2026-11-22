"use client";

/* eslint-disable @next/next/no-img-element */
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { Hero } from "@/components/cinema/Hero";
import { Showcases } from "@/components/cinema/Showcases";
import { Reveal } from "@/components/cinema/Reveal";
import { EntranceContext, Movable, Txt, textOf, useEditing } from "./Editable";
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
 * flips automatically (light text on dark backgrounds) so words stay readable. */
export function SectionFrame({ s, children }: { s: Section; children: ReactNode }) {
  const st = styleOf(s);
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
  if (background) cls.push("band-fade text-ink");
  if (background && st.grain) cls.push("vintage");
  if (st.height === "tight") cls.push("sec-tight");
  if (st.height === "roomy") cls.push("sec-roomy");
  if (st.height === "screen") cls.push("sec-screen");
  if (st.hover && st.hover !== "none") cls.push(`fx-${st.hover}`);

  return (
    // Clip only when there is a background to keep inside; otherwise moved pieces may overhang.
    <div
      data-mode={mode}
      className={`relative ${background ? "overflow-hidden" : ""} ${cls.join(" ")}`}
      style={background ? { background } : undefined}
    >
      <EntranceContext.Provider value={st.entrance ?? "rise"}>{children}</EntranceContext.Provider>
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
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 60% 80% at 50% 120%, color-mix(in srgb, var(--accent) 40%, transparent), transparent 70%)" }}
      />
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
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/2 h-[70%] -translate-y-1/2"
        style={{ background: "radial-gradient(ellipse 60% 50% at 50% 50%, color-mix(in srgb, var(--accent) 22%, transparent), transparent 70%)" }}
      />
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
              src="/signatures/elena-signature.webp"
              alt="Elena's signature"
              className="h-auto w-32 invert mix-blend-screen light:invert-0 light:mix-blend-multiply sm:w-[213px]"
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

function Vault({ s }: { s: Section }) {
  return (
    <section className="px-4 py-16 sm:px-6 sm:py-20">
      <Movable s={s} id="card" label="Vault card" className="mx-auto max-w-[1200px]">
        <div className="vintage relative overflow-hidden rounded-2xl border border-line">
          <Image
            src="/client-work-vault.webp"
            alt=""
            aria-hidden
            fill
            sizes="(min-width: 1200px) 1200px, 100vw"
            className="object-cover [filter:sepia(.35)_contrast(1.1)_saturate(.8)]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d090a] via-[#0d090a]/85 to-[#5c0f24]/60" />
          <div className="relative flex flex-col items-start gap-5 px-6 py-14 sm:gap-6 sm:px-14 sm:py-20">
            <Txt s={s} k="eyebrow" as="p" className="block text-xs uppercase tracking-[0.3em] text-[#e6b98f]" />
            <h2 className="font-display text-3xl font-black uppercase text-[#f4efe9] sm:text-6xl">
              <Txt s={s} k="title" /> <Txt s={s} k="titleSpark" className="text-[#f5c84c]" />
            </h2>
            <Txt s={s} k="body" as="p" className="block max-w-lg text-base text-[#f4efe9]/85 sm:text-lg" />
            <Link
              href="/clients"
              className="focus-brand rounded-full bg-[#f5c84c] px-7 py-3.5 text-xs font-bold uppercase tracking-[0.15em] text-[#160b0d] transition-colors duration-300 hover:bg-[#8e1b3a] hover:text-white"
            >
              <Txt s={s} k="cta" />
            </Link>
          </div>
        </div>
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
            data-mode="dark"
            className="vintage relative overflow-hidden rounded-2xl bg-paper p-4 text-ink shadow-[0_40px_80px_-40px_rgba(40,8,20,.7)] sm:p-8"
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
  }
}

export type CanvasControls = { selectedId: string | null; select: (id: string) => void };

/** Renders the homepage from its layout. With `canvas`, sections become
 * selectable for the admin editor (hidden ones are shown faded). */
export function HomeSections({ layout, slots, canvas }: { layout: HomeLayout; slots: Slots; canvas?: CanvasControls }) {
  const list = canvas ? layout.sections : layout.sections.filter((s) => !s.hidden);
  return (
    <ThemeScope theme={layout.theme}>
      {list.map((s) =>
        canvas ? (
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
              <SectionFrame s={s}>{renderSection(s, slots)}</SectionFrame>
            </div>
          </div>
        ) : (
          <SectionFrame key={s.id} s={s}>
            {renderSection(s, slots)}
          </SectionFrame>
        )
      )}
    </ThemeScope>
  );
}
