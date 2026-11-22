import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { PortfolioGrid } from "@/components/PortfolioGrid";
import { RecBar } from "@/components/cinema/RecBar";

export const metadata: Metadata = {
  title: "Portfolio — Salraza Marketing",
  description:
    "Social media management, photography and short-form video from Salraza Marketing.",
};

// Portfolio items now come from the database instead of a hardcoded list —
// force this page to render per-request so an admin adding/removing a photo
// shows up immediately, not just after the next deploy.
export const dynamic = "force-dynamic";

export default function PortfolioPage() {
  return (
    <>
      <SiteHeader revealImmediately />
      <main className="px-4 pt-36 pb-20 sm:px-6 sm:pt-44">
        <div className="mx-auto max-w-[1200px]">
          <p className="text-xs uppercase tracking-[0.3em] text-warm-text">Gallery</p>
          <h1 className="title-lit mt-5 max-w-3xl font-display text-4xl font-black uppercase leading-[1.05] sm:text-6xl">
            Moments, frozen in time
          </h1>
          <p className="mt-5 max-w-lg text-lg text-ink-muted">
            Events, teams, products and people — a reel of recent work.
          </p>

          <div className="mt-14">
            <PortfolioGrid size="large" />
          </div>

          <div className="mt-24 border-t border-line pt-16 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-warm-text">Social</p>
            <h2 className="title-lit mt-5 font-display text-3xl font-black uppercase sm:text-5xl">Follow the reel</h2>
            <p className="mt-4 text-lg text-ink-muted">@salraza.film on Instagram and TikTok</p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <a
                href="https://www.instagram.com/salraza.film/"
                target="_blank"
                rel="noopener noreferrer"
                className="focus-brand rounded-full bg-spark px-7 py-3.5 text-xs font-bold uppercase tracking-[0.15em] text-[#160b0d] transition-colors hover:bg-accent hover:text-white"
              >
                Instagram
              </a>
              <a
                href="https://www.tiktok.com/@salraza.film"
                target="_blank"
                rel="noopener noreferrer"
                className="focus-brand rounded-full border border-ink/30 px-7 py-3.5 text-xs font-bold uppercase tracking-[0.15em] text-ink transition-colors hover:border-accent-bright hover:text-accent-bright"
              >
                TikTok
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <RecBar />
    </>
  );
}
