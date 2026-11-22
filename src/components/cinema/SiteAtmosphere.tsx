"use client";

import { usePathname } from "next/navigation";

/** Fixed, decorative background behind every page: burgundy glow, a soft
 * light beam, film scratches and moving grain. Styles live in globals.css. */
export function SiteAtmosphere() {
  return (
    <div aria-hidden className="atmo">
      <div className="atmo-beam" />
      <div className="atmo-leak" />
      <div className="atmo-scratches" />
      <div className="atmo-line atmo-line-1" />
      <div className="atmo-line atmo-line-2" />
      <div className="atmo-dust" />
      <div className="atmo-grain" />
      <div className="atmo-grain atmo-grain-coarse" />
      <div className="atmo-vignette" />
    </div>
  );
}

/** Film grain and a soft warm vignette laid over everything, for a vintage feel. */
export function FilmGrain() {
  // Inside a client's vault the page stays clean: no grain, scratches or fade.
  const pathname = usePathname();
  if (/^\/clients\/[^/]+\/vault/.test(pathname ?? "")) return null;
  return (
    <>
      <div aria-hidden className="film-grain-warm" />
      <div aria-hidden className="film-fade" />
      <div aria-hidden className="film-grain" />
      <div aria-hidden className="film-scratches" />
    </>
  );
}
