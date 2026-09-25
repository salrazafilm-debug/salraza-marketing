import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { PortfolioGrid } from "@/components/PortfolioGrid";
import { InstagramEmbeds } from "@/components/InstagramEmbeds";
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

          <div className="mt-20 border-t border-line pt-16">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-caption uppercase tracking-wide text-warm-text">
                  On Instagram
                </p>
                <h2 className="text-headline mt-3 text-ink">Follow along</h2>
              </div>
              <a
                href="https://www.instagram.com/thedmvcrabrolls/"
                target="_blank"
                rel="noopener noreferrer"
                className="focus-brand inline-flex items-center justify-center self-start rounded-full bg-ink px-6 py-3 text-label text-paper transition hover:opacity-90"
              >
                Follow @thedmvcrabrolls
              </a>
            </div>

            <div className="mt-10">
              <InstagramEmbeds />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
