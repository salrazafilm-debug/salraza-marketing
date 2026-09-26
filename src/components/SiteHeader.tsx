"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const NAV_LINKS = [
  { href: "/#services", label: "Services" },
  { href: "/#about", label: "About" },
  { href: "/portfolio", label: "Gallery" },
];

const MEDIA_VAULT_LINK = { href: "/clients", label: "Media Vault" };

function MediaVaultLink({
  className = "",
  onClick,
  marksmenTheme = false,
}: {
  className?: string;
  onClick?: () => void;
  marksmenTheme?: boolean;
}) {
  return (
    <Link
      href={MEDIA_VAULT_LINK.href}
      onClick={onClick}
      className={`focus-brand inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-display text-sm font-extrabold tracking-wide transition hover:brightness-110 ${
        marksmenTheme
          ? "border border-[#2fc4de]/50 bg-[#111823] text-[#2fc4de]"
          : "bg-espresso text-golden-hour"
      } ${className}`}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="7" width="10" height="7" rx="1.5" />
        <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
      </svg>
      {MEDIA_VAULT_LINK.label}
    </Link>
  );
}

export function SiteHeader({
  revealImmediately = false,
  theme = "default",
}: {
  revealImmediately?: boolean;
  /** "marksmen" gives the banner the club's black + cyan look. Only pass
   * this from the DMV Marksmen vault page — every other page keeps the
   * site's normal look. */
  theme?: "default" | "marksmen";
}) {
  const [revealed, setRevealed] = useState(revealImmediately);
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const marksmenTheme = theme === "marksmen";

  useEffect(() => {
    if (revealImmediately) return;

    // Reveal once the hero video (HeroVideo, a separate component) settles
    // on its still end frame — on both mobile and desktop — rather than
    // sitting over the cinematic intro. Scrolling past the hero is kept as
    // a fallback in case that event is ever missed (e.g. a JS error
    // elsewhere), so navigation can never get permanently stuck hidden.
    //
    // (A previous version of this made mobile reveal immediately, since
    // mobile video loads used to be flakier. That's been hardened
    // separately in HeroVideo.tsx now, and the header should behave the
    // same on both — hidden during the intro, revealed once it settles.)
    let settled = false;
    let scrolledPast = false;
    const update = () => setRevealed(settled || scrolledPast);

    const onHeroSettled = (event: Event) => {
      settled = Boolean((event as CustomEvent<boolean>).detail);
      update();
    };
    window.addEventListener("hero-settled", onHeroSettled);

    const hero = document.getElementById("hero");
    let observer: IntersectionObserver | null = null;
    if (hero) {
      observer = new IntersectionObserver(
        ([entry]) => {
          scrolledPast = !entry.isIntersecting;
          update();
        },
        { threshold: 0.15 }
      );
      observer.observe(hero);
    } else {
      scrolledPast = true;
      update();
    }

    return () => {
      window.removeEventListener("hero-settled", onHeroSettled);
      observer?.disconnect();
    };
  }, [revealImmediately]);

  return (
    <header
      ref={headerRef}
      className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ease-out ${
        revealed
          ? marksmenTheme
            ? "translate-y-0 opacity-100 border-transparent bg-[#0a0a0c]/95 backdrop-blur"
            : "translate-y-0 opacity-100 border-line bg-paper/95 backdrop-blur"
          : "pointer-events-none -translate-y-2 opacity-0 border-transparent"
      }`}
    >
      {/*
        Mobile-only: taller vertical padding than desktop. The hero video
        below (HeroVideo.tsx) is deliberately shorter on mobile (h-[82svh])
        and its object-fit:contain letterboxing leaves an empty bg-espresso
        strip above the zoomed logo — the video's own centering/zoom is
        locked and must not change (see HeroVideo.tsx), so instead this
        fixed header is grown taller to overlay that strip, closing the gap
        with more of the cream header band rather than moving the video.
        md:py-3 keeps desktop's confirmed, untouched sizing. The logo below
        is bigger on mobile for the same reason (h-16 vs desktop's h-12) —
        padding was shrunk to py-[26px] to compensate, so the header's total
        height stays ~117px either way (logo + padding), still lined up with
        where the video's visible content begins.
      */}
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-4 py-[26px] sm:px-6 md:py-3">
        <Link href="/" className="flex items-center" aria-label="Salraza Marketing home">
          {/*
            The regular wordmark is dark ink, drawn for a light header — on
            the Marksmen theme's near-black banner it would nearly vanish,
            so that theme uses a variant with its own white cloud backdrop
            baked in instead.
          */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={
              marksmenTheme
                ? "/clients/dmv-marksmen/salraza-cloud-logo.png"
                : "/logos/salraza-logo-transparent.png"
            }
            alt="Salraza Marketing"
            className={marksmenTheme ? "h-24 w-auto md:h-20" : "h-16 w-auto md:h-12"}
          />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`focus-brand text-label transition ${
                marksmenTheme
                  ? "text-white hover:text-[#2fc4de]"
                  : "text-ink hover:text-purple-text"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <MediaVaultLink marksmenTheme={marksmenTheme} />
          <Link
            href="/#quote"
            className={`focus-brand inline-flex items-center rounded-full px-5 py-2.5 font-display text-sm font-extrabold tracking-wide transition ${
              marksmenTheme
                ? "bg-[#2fc4de] text-[#04141a] hover:brightness-95"
                : "bg-highlighter text-on-highlighter hover:brightness-95"
            }`}
          >
            Start
          </Link>
        </div>

        <button
          type="button"
          className={`focus-brand flex h-10 w-10 items-center justify-center rounded-full md:hidden ${
            marksmenTheme ? "text-white" : ""
          }`}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="sr-only">Menu</span>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {menuOpen ? (
              <path d="M4 4l14 14M18 4L4 18" />
            ) : (
              <path d="M2 6h18M2 11h18M2 16h18" />
            )}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <nav
          className={`flex flex-col gap-1 border-t px-4 py-3 md:hidden ${
            marksmenTheme ? "border-[#17363d] bg-[#0a0a0c]" : "border-line bg-paper"
          }`}
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`focus-brand rounded px-2 py-2.5 text-label ${
                marksmenTheme ? "text-white" : "text-ink"
              }`}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <MediaVaultLink
            className="mt-1 justify-center"
            onClick={() => setMenuOpen(false)}
            marksmenTheme={marksmenTheme}
          />
          <Link
            href="/#quote"
            className={`focus-brand mt-1 inline-flex items-center justify-center rounded-full px-5 py-2.5 font-display text-sm font-extrabold tracking-wide ${
              marksmenTheme ? "bg-[#2fc4de] text-[#04141a]" : "bg-highlighter text-on-highlighter"
            }`}
            onClick={() => setMenuOpen(false)}
          >
            Start
          </Link>
        </nav>
      )}
    </header>
  );
}
