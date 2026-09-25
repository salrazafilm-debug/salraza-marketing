import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { PortfolioGrid } from "@/components/PortfolioGrid";
import { Highlight } from "@/components/Highlight";

export const metadata: Metadata = {
  title: "Portfolio — Salraza Marketing",
  description:
    "Social media management, photography and short-form video from Salraza Marketing.",
};

export default function PortfolioPage() {
  return (
    <>
      <SiteHeader revealImmediately />
      <main className="px-4 pt-36 pb-20 sm:px-6 sm:pt-40">
        <div className="mx-auto max-w-[1200px]">
          <p className="text-eyebrow uppercase text-ink">Gallery</p>
          <h1 className="text-headline mt-5 max-w-2xl text-ink">
            A look at moments - <Highlight variant="frost">frozen</Highlight> in time
          </h1>

          <div className="mt-12">
            <PortfolioGrid />
          </div>

          <div className="mt-20 border-t border-line pt-16 text-center">
            <p className="text-eyebrow uppercase text-ink">Social</p>
            <h2 className="text-headline mt-5 text-ink">Follow us on social media</h2>
            <p className="mt-4 text-body text-ink-muted">@salraza.film on Instagram and TikTok</p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <a
                href="https://www.instagram.com/salraza.film/"
                target="_blank"
                rel="noopener noreferrer"
                className="focus-brand inline-flex items-center justify-center rounded-full bg-ink px-6 py-3 text-label text-paper transition hover:opacity-90"
              >
                Instagram
              </a>
              <a
                href="https://www.tiktok.com/@salraza.film"
                target="_blank"
                rel="noopener noreferrer"
                className="focus-brand inline-flex items-center justify-center rounded-full bg-ink px-6 py-3 text-label text-paper transition hover:opacity-90"
              >
                TikTok
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
