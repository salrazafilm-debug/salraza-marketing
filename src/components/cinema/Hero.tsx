"use client";

import Link from "next/link";
import { ScribbleCanvas, type ScribbleStyle } from "./ScribbleCanvas";
import { ReelStrip } from "./ReelStrip";
import { Movable, Txt } from "@/components/site/Editable";
import { imagesOf, type Section } from "@/components/site/layout-types";
import { photoTitle } from "./photos";

// Purple, blue and a little gold — the "life" borrowed from Golden Hour,
// kept to the scribbles so the page itself stays Velvet.
const SCRIBBLE: ScribbleStyle = { colors: ["#c164fc", "#a8e6ff", "#f5c84c"], width: 3, life: 1400, wobble: 1.4, glow: 14 };

function Corners() {
  const c = "absolute h-8 w-8 border-ink/45 sm:h-14 sm:w-14";
  return (
    <div aria-hidden className="pointer-events-none absolute inset-3 sm:inset-5">
      <span className={`${c} left-0 top-0 border-l-2 border-t-2`} />
      <span className={`${c} right-0 top-0 border-r-2 border-t-2`} />
      <span className={`${c} bottom-0 left-0 border-b-2 border-l-2`} />
      <span className={`${c} bottom-0 right-0 border-b-2 border-r-2`} />
    </div>
  );
}

/** Title and tagline up top, the photo strip straight after so it's fully on
 * screen without scrolling, and the two buttons underneath the photos. */
export function Hero({ s }: { s: Section }) {
  return (
    <section id="hero" className="relative flex min-h-[100svh] flex-col items-center justify-center pb-24 pt-24 sm:pb-20 sm:pt-28">
      <Corners />

      <div className="relative z-10 w-full max-w-5xl px-4">
        <Movable s={s} id="sig" label="Signature" className="mb-2 text-center sm:mb-4">
          <Txt s={s} k="sig" as="p" className="block text-[10px] uppercase tracking-[0.4em] text-warm-text sm:text-xs" />
        </Movable>
        <Movable s={s} id="title" label="Title">
          <div className="relative mx-auto flex h-[150px] items-center justify-center sm:h-[230px] lg:h-[260px]">
            <ScribbleCanvas style={SCRIBBLE} />
            <Txt
              s={s}
              k="title"
              as="h1"
              className="hero-word relative text-center font-display text-[15vw] font-black leading-none tracking-tight sm:text-[9.5rem] lg:text-[11.5rem]"
            />
          </div>
        </Movable>
        <Movable s={s} id="tagline" label="Tagline">
          <p className="mx-auto max-w-md text-center text-[11px] uppercase tracking-[0.2em] text-ink/80 sm:text-sm">
            <Txt s={s} k="tagline" /> <Txt s={s} k="spark" className="text-spark" />
          </p>
        </Movable>
      </div>

      <div className="relative z-10 mt-1 w-full sm:mt-3">
        <ReelStrip photos={imagesOf(s, "strip").map((url) => ({ thumb: url, title: photoTitle(url) }))} />
      </div>

      <Movable s={s} id="buttons" label="Buttons" className="relative z-10 mt-5 flex justify-center gap-3 px-4 sm:mt-7">
        <Link
          href="/#quote"
          className="focus-brand whitespace-nowrap rounded-full bg-spark px-5 py-3.5 text-xs font-bold uppercase tracking-[0.15em] text-[#160b0d] transition-colors duration-300 hover:bg-accent hover:text-white sm:px-7"
        >
          <Txt s={s} k="cta1" />
        </Link>
        <Link
          href="/portfolio"
          className="focus-brand whitespace-nowrap rounded-full border border-ink/30 px-5 py-3.5 text-xs font-bold uppercase tracking-[0.15em] text-ink transition-colors duration-300 hover:border-accent-bright hover:text-accent-bright sm:px-7"
        >
          <Txt s={s} k="cta2" />
        </Link>
      </Movable>
    </section>
  );
}
