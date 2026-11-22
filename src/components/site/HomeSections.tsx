"use client";

/* eslint-disable @next/next/no-img-element */
import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Hero } from "@/components/cinema/Hero";
import { Showcases } from "@/components/cinema/Showcases";
import { Reveal } from "@/components/cinema/Reveal";
import { Txt } from "./Editable";
import { SECTION_LIBRARY, type HomeLayout, type Section, type SectionType } from "./layout-types";

export type Slots = { gallery: ReactNode; quote: ReactNode };

export type EditorControls = {
  move: (id: string, dir: -1 | 1) => void;
  toggleHidden: (id: string) => void;
  remove: (id: string) => void;
  add: (index: number, type: SectionType) => void;
};

function Eyebrow({ s, k = "eyebrow" }: { s: Section; k?: string }) {
  return <Txt s={s} k={k} as="p" className="block text-xs uppercase tracking-[0.3em] text-warm-text" />;
}

function Statement({ s }: { s: Section }) {
  return (
    <section data-mode="dark" className="vintage band-fade relative overflow-hidden bg-paper text-ink">
     <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 60% 80% at 50% 120%, color-mix(in srgb, var(--accent) 40%, transparent), transparent 70%)" }}
      />
     <div className="relative mx-auto max-w-5xl px-6 py-24 text-center sm:py-32">
      <Reveal>
        <Eyebrow s={s} />
      </Reveal>
      <Reveal as="h2" delay={100} className="mt-6 font-display text-3xl font-black uppercase leading-[1.05] sm:text-6xl">
        <Txt s={s} k="part1" className="text-accent-bright" />{" "}
        <Txt s={s} k="part2" className="title-lit" />{" "}
        <Txt s={s} k="part3" className="text-spark" />
      </Reveal>
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
        style={{ background: "radial-gradient(ellipse 60% 50% at 50% 50%, color-mix(in srgb, var(--accent) 35%, transparent), transparent 70%)" }}
      />
      <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
        <Reveal>
          <Eyebrow s={s} />
        </Reveal>
        <Reveal delay={80}>
          <Txt s={s} k="title" as="h2" className="title-lit block font-display text-4xl font-black uppercase sm:text-6xl" />
        </Reveal>
        <Reveal delay={160}>
          <Txt s={s} k="body" as="p" className="block max-w-xl text-base text-ink/85 sm:text-lg" />
        </Reveal>
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
      </div>
    </section>
  );
}

function Gallery({ s, slot }: { s: Section; slot: ReactNode }) {
  return (
    <section className="px-4 py-24 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-[1200px]">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Reveal>
              <Eyebrow s={s} />
            </Reveal>
            <Reveal delay={80}>
              <Txt s={s} k="title" as="h2" className="title-lit mt-4 block font-display text-4xl font-black uppercase sm:text-6xl" />
            </Reveal>
          </div>
          <Link
            href="/portfolio"
            className="focus-brand w-fit rounded-full border border-ink/30 px-6 py-3 text-xs font-bold uppercase tracking-[0.15em] text-ink transition-colors hover:border-accent-bright hover:text-accent-bright"
          >
            <Txt s={s} k="link" />
          </Link>
        </div>
        <div className="mt-12">{slot}</div>
      </div>
    </section>
  );
}

function Vault({ s }: { s: Section }) {
  return (
    <section className="px-4 py-16 sm:px-6 sm:py-20">
      <div className="vintage relative mx-auto max-w-[1200px] overflow-hidden rounded-2xl border border-line">
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
    </section>
  );
}

function Quote({ s, slot }: { s: Section; slot: ReactNode }) {
  return (
    <section id="quote" className="px-4 py-24 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-[900px]">
        <div className="text-center">
          <Reveal>
            <Eyebrow s={s} />
          </Reveal>
          <Reveal delay={80}>
            <Txt s={s} k="title" as="h2" className="title-lit mt-4 block font-display text-4xl font-black uppercase sm:text-6xl" />
          </Reveal>
          <Txt s={s} k="body" as="p" className="mx-auto mt-4 block max-w-lg text-base text-ink-muted sm:text-lg" />
        </div>
        <div data-mode="dark" className="vintage relative mt-12 overflow-hidden rounded-2xl bg-paper p-4 text-ink shadow-[0_40px_80px_-40px_rgba(40,8,20,.7)] sm:p-8">
          {slot}
        </div>
      </div>
    </section>
  );
}

function TextBlock({ s }: { s: Section }) {
  return (
    <section className="px-4 py-20 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <Eyebrow s={s} />
        </Reveal>
        <Reveal delay={80}>
          <Txt s={s} k="title" as="h2" className="title-lit mt-4 block font-display text-3xl font-black uppercase sm:text-5xl" />
        </Reveal>
        <Reveal delay={160}>
          <Txt s={s} k="body" as="p" className="mt-5 block whitespace-pre-line text-base text-ink/85 sm:text-lg" />
        </Reveal>
      </div>
    </section>
  );
}

function Banner({ s }: { s: Section }) {
  return (
    <section className="relative px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-4xl text-center">
        <Reveal>
          <Txt s={s} k="quote" as="p" className="block font-script text-4xl leading-tight text-ink sm:text-6xl" />
        </Reveal>
        <Reveal delay={120}>
          <Txt s={s} k="caption" as="p" className="mt-6 block text-xs uppercase tracking-[0.3em] text-warm-text" />
        </Reveal>
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
  }
}

/* ---------- editor-only chrome ---------- */

function AddSection({ index, layout, onAdd }: { index: number; layout: HomeLayout; onAdd: EditorControls["add"] }) {
  const [open, setOpen] = useState(false);
  const present = new Set(layout.sections.map((s) => s.type));
  const options = (Object.keys(SECTION_LIBRARY) as SectionType[]).filter(
    (t) => !(SECTION_LIBRARY[t].single && present.has(t))
  );
  return (
    <div className="relative z-30 flex justify-center py-2" data-mode="dark">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="rounded-full border border-dashed border-[#f5c84c]/70 bg-[#0d090a]/90 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-[#f5c84c] backdrop-blur hover:bg-[#f5c84c] hover:text-black"
      >
        {open ? "× Close" : "+ Add section"}
      </button>
      {open && (
        <div className="absolute top-11 z-40 grid w-[min(92vw,560px)] gap-2 rounded-xl border border-[#3a2a2d] bg-[#1a1113] p-3 shadow-2xl sm:grid-cols-2">
          {options.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                onAdd(index, t);
                setOpen(false);
              }}
              className="rounded-lg border border-[#3a2a2d] p-3 text-left text-[#f4efe9] hover:border-[#f5c84c]"
            >
              <span className="block text-sm font-bold">{SECTION_LIBRARY[t].label}</span>
              <span className="mt-1 block text-xs text-[#b3a5a2]">{SECTION_LIBRARY[t].description}</span>
            </button>
          ))}
          {options.length === 0 && <p className="p-2 text-sm text-[#b3a5a2]">Every section is already on the page.</p>}
        </div>
      )}
    </div>
  );
}

function SectionToolbar({ s, index, total, c }: { s: Section; index: number; total: number; c: EditorControls }) {
  const btn =
    "rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-[#f4efe9] hover:bg-white/15 disabled:opacity-30";
  return (
    <div className="absolute right-3 top-3 z-30 flex items-center gap-1 rounded-full border border-[#3a2a2d] bg-[#0d090a]/90 p-1 shadow-lg backdrop-blur" data-mode="dark">
      <span className="px-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[#f5c84c]">{SECTION_LIBRARY[s.type].label}</span>
      <button type="button" className={btn} disabled={index === 0} onClick={() => c.move(s.id, -1)} aria-label="Move up">↑</button>
      <button type="button" className={btn} disabled={index === total - 1} onClick={() => c.move(s.id, 1)} aria-label="Move down">↓</button>
      <button type="button" className={btn} onClick={() => c.toggleHidden(s.id)}>{s.hidden ? "Show" : "Hide"}</button>
      <button
        type="button"
        className={`${btn} hover:bg-[#8e1b3a]`}
        onClick={() => {
          if (confirm(`Delete the "${SECTION_LIBRARY[s.type].label}" section? (Its words are lost; you can add it again.)`)) c.remove(s.id);
        }}
      >
        Delete
      </button>
    </div>
  );
}

/** Renders the homepage from its layout. With `editor`, adds per-section
 * controls and "add section" buttons (used by the admin site editor). */
export function HomeSections({ layout, slots, editor }: { layout: HomeLayout; slots: Slots; editor?: EditorControls }) {
  const list = editor ? layout.sections : layout.sections.filter((s) => !s.hidden);
  return (
    <>
      {editor && <AddSection index={0} layout={layout} onAdd={editor.add} />}
      {list.map((s, i) => (
        <div key={s.id} className={editor ? "relative outline-1 outline-dashed outline-transparent hover:outline-[#f5c84c]/40" : undefined}>
          {editor && <SectionToolbar s={s} index={i} total={list.length} c={editor} />}
          <div className={editor && s.hidden ? "pointer-events-none opacity-30 grayscale" : undefined}>{renderSection(s, slots)}</div>
          {editor && s.hidden && (
            <p className="absolute left-1/2 top-6 z-30 -translate-x-1/2 rounded-full bg-[#8e1b3a] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-white">
              Hidden from the live site
            </p>
          )}
          {editor && <AddSection index={i + 1} layout={layout} onAdd={editor.add} />}
        </div>
      ))}
    </>
  );
}
