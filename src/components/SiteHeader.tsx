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
      className={`focus-brand inline-flex items-center gap-2 rounded-full transition ${
        marksmenTheme
          ? "border border-[#2fc4de]/50 bg-[#111823] px-5 py-2.5 font-display text-sm font-extrabold tracking-wide text-[#2fc4de] hover:brightness-110"
          : "border border-ink/25 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.15em] text-ink hover:border-spark hover:text-spark"
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

    // Pages that don't pass revealImmediately show the header once a
    // "hero-settled" event fires or once the visitor scrolls past #hero; with
    // no #hero on the page it shows straight away, so navigation can never
    // get stuck hidden.
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

  // The Marksmen vault has no hero section to key off, and its page is
  // long enough that keeping the banner pinned the whole time gets in the
  // way — so there it fades out as soon as you scroll and reappears once
  // you're back near the top, instead of just staying revealed forever.
  useEffect(() => {
    if (!marksmenTheme) return;
    const onScroll = () => setRevealed(window.scrollY < 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [marksmenTheme]);

  return (
    <header
      ref={headerRef}
      className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ease-out ${
        revealed
          ? marksmenTheme
            ? "translate-y-0 opacity-100 border-transparent bg-[#0a0a0c]/95 backdrop-blur"
            : "translate-y-0 opacity-100 border-line/70 bg-paper/90"
          : "pointer-events-none -translate-y-2 opacity-0 border-transparent"
      }`}
    >
      <div
        className={`mx-auto flex max-w-[1200px] items-center justify-between px-4 sm:px-6 md:py-3 ${
          marksmenTheme ? "py-[26px]" : "py-4"
        }`}
      >
        <Link href="/" className="flex items-center" aria-label="Salraza Marketing home">
          {/*
            The regular wordmark is dark ink, drawn for a light header — on
            the Marksmen theme's near-black banner it would nearly vanish,
            so that theme uses a variant with its own white cloud backdrop
            baked in instead.
          */}
          {marksmenTheme ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/clients/dmv-marksmen/salraza-cloud-logo.png" alt="Salraza Marketing" className="h-24 w-auto md:h-20" />
          ) : (
            // Velvet wordmark: text, so it reads in both light and dark mode.
            <span className="flex items-center gap-2 font-display text-lg font-black tracking-wider text-ink">
              SALRAZA
              <span className="rec-blink h-2 w-2 rounded-full bg-spark shadow-[0_0_8px_var(--spark)]" />
            </span>
          )}
        </Link>

        <nav className="hidden items-center gap-10 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`focus-brand transition ${
                marksmenTheme
                  ? "text-label text-white hover:text-[#2fc4de]"
                  : "text-[11px] font-bold uppercase tracking-[0.2em] text-ink hover:text-accent-bright"
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
            className={`focus-brand inline-flex items-center rounded-full transition ${
              marksmenTheme
                ? "bg-[#2fc4de] px-5 py-2.5 font-display text-sm font-extrabold tracking-wide text-[#04141a] hover:brightness-95"
                : "bg-spark px-5 py-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[#160b0d] hover:bg-accent hover:text-white"
            }`}
          >
            Start
          </Link>
        </div>

        {/* Phones: Media Vault sits right in the top bar, next to the menu. */}
        <MediaVaultLink
          className="ml-auto mr-1 !gap-1.5 !px-3 !py-1.5 !text-[10px] md:hidden"
          marksmenTheme={false}
        />

        <button
          type="button"
          className={`focus-brand flex h-10 w-10 items-center justify-center rounded-full md:hidden ${
            marksmenTheme ? "text-white" : "text-ink"
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
              marksmenTheme ? "bg-[#2fc4de] text-[#04141a]" : "bg-spark text-[#160b0d]"
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
