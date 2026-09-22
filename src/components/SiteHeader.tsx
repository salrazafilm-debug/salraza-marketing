"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const NAV_LINKS = [
  { href: "/#services", label: "Services" },
  { href: "/#about", label: "About" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/clients", label: "Client work" },
];

export function SiteHeader({ revealImmediately = false }: { revealImmediately?: boolean }) {
  const [revealed, setRevealed] = useState(revealImmediately);
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (revealImmediately) return;

    // On mobile the header (logo + menu) stays visible from the start rather
    // than hiding over the cinematic hero — there's no room to spare, and
    // navigation should always be reachable on a phone. Desktop keeps the
    // fade-in-on-scroll reveal.
    const mobileQuery = window.matchMedia("(max-width: 767px)");
    let observer: IntersectionObserver | null = null;

    const setup = () => {
      observer?.disconnect();
      observer = null;

      if (mobileQuery.matches) {
        setRevealed(true);
        return;
      }

      const hero = document.getElementById("hero");
      if (!hero) {
        setRevealed(true);
        return;
      }

      observer = new IntersectionObserver(
        ([entry]) => setRevealed(!entry.isIntersecting),
        { threshold: 0.15 }
      );
      observer.observe(hero);
    };

    setup();
    mobileQuery.addEventListener("change", setup);
    return () => {
      observer?.disconnect();
      mobileQuery.removeEventListener("change", setup);
    };
  }, [revealImmediately]);

  return (
    <header
      ref={headerRef}
      className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ease-out ${
        revealed
          ? "translate-y-0 opacity-100 border-line bg-paper/95 backdrop-blur"
          : "pointer-events-none -translate-y-2 opacity-0 border-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center" aria-label="Salraza Marketing home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logos/salraza-logo-transparent.png"
            alt="Salraza Marketing"
            className="h-10 w-auto sm:h-12"
          />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="focus-brand text-label text-ink hover:text-purple-text"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
          <Link
            href="/#quote"
            className="focus-brand inline-flex items-center rounded-full bg-highlighter px-5 py-2.5 font-display text-sm font-extrabold tracking-wide text-on-highlighter transition hover:brightness-95"
          >
            Start
          </Link>
        </div>

        <button
          type="button"
          className="focus-brand flex h-10 w-10 items-center justify-center rounded-full md:hidden"
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
        <nav className="flex flex-col gap-1 border-t border-line bg-paper px-4 py-3 md:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="focus-brand rounded px-2 py-2.5 text-label text-ink"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/#quote"
            className="focus-brand mt-1 inline-flex items-center justify-center rounded-full bg-highlighter px-5 py-2.5 font-display text-sm font-extrabold tracking-wide text-on-highlighter"
            onClick={() => setMenuOpen(false)}
          >
            Start
          </Link>
        </nav>
      )}
    </header>
  );
}
