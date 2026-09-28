import Image from "next/image";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { HeroVideo } from "@/components/HeroVideo";
import { Highlight } from "@/components/Highlight";
import { LinkButton } from "@/components/Button";
import { PortfolioGrid } from "@/components/PortfolioGrid";
import { QuoteForm } from "@/components/QuoteForm";

// The homepage embeds the portfolio grid, which now reads from the database
// instead of a hardcoded list — force this page to render per-request so an
// admin adding/removing a photo shows up immediately, not just after the
// next deploy.
export const dynamic = "force-dynamic";

const SERVICES = [
  {
    title: "Social media management",
    body: "We manage and create video content for the world to see, love, and follow your online pages.",
    accent: "bg-white text-black",
    icon: (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="20" height="14" rx="2" />
        <path d="M8 22h10M13 18v4" />
        <image href="/logos/salraza-logo-transparent.png" x="6" y="7.5" width="14" height="7" preserveAspectRatio="xMidYMid meet" />
      </svg>
    ),
  },
  {
    title: "Photography",
    body: "We capture moments and freeze them in time forever.",
    accent: "bg-white text-black",
    icon: (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 8h4l2-3h8l2 3h4v13H3z" />
        <circle cx="13" cy="14" r="4" />
      </svg>
    ),
  },
  {
    title: "Website creation",
    body: "A site that showcases your name and work.",
    accent: "bg-white text-black",
    icon: (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="20" height="16" rx="2" />
        <path d="M3 10h20" />
        <circle cx="6.5" cy="7.5" r="0.6" fill="currentColor" stroke="none" />
        <circle cx="9" cy="7.5" r="0.6" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    title: "Branding",
    body: "We help you find the style and design that fits you and establish your brand to the world.",
    accent: "bg-white text-black",
    icon: (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 3a10 10 0 1 0 0 20c1.5 0 2.5-1 2.5-2.3 0-.6-.2-1.1-.6-1.5-.4-.4-.6-.9-.6-1.5 0-1.3 1-2.3 2.3-2.3H18a5 5 0 0 0 5-5c0-4-4.5-7.4-10-7.4Z" />
        <circle cx="8" cy="10" r="1.1" fill="currentColor" stroke="none" />
        <circle cx="13" cy="7.5" r="1.1" fill="currentColor" stroke="none" />
        <circle cx="18" cy="10" r="1.1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    title: "Logo",
    body: "We can create & design a look for your company to be recognized anywhere.",
    accent: "bg-white text-black",
    icon: (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="13" cy="10" r="6.5" />
        <path d="M9.5 15.5 8 22l5-2.5 5 2.5-1.5-6.5" />
      </svg>
    ),
  },
  {
    title: "Brand refresh",
    body: "Update and give your look a modern glow up.",
    accent: "bg-white text-black",
    icon: (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 3c0 4-1 7-3 9s-5 3-9 3c4 0 7 1 9 3s3 5 3 9c0-4 1-7 3-9s5-3 9-3c-4 0-7-1-9-3s-3-5-3-9Z" />
      </svg>
    ),
  },
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <HeroVideo />

        <section className="relative overflow-hidden bg-espresso px-4 py-16 text-center sm:px-6 sm:py-20">
          <Image
            src="/sky-hero-band.jpg"
            alt=""
            aria-hidden
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-espresso/45" />
          <div className="relative mx-auto max-w-3xl">
            <h1
              className="text-display-hero text-golden-hour"
              style={{ textShadow: "0 2px 4px rgba(0,0,0,0.5), 0 8px 24px rgba(0,0,0,0.45)" }}
            >
              The sky is the limit
            </h1>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <LinkButton href="#quote">Start</LinkButton>
              <LinkButton href="/portfolio" variant="secondary" className="bg-transparent text-golden-hour ring-1 ring-golden-hour/40 hover:bg-white/5">
                See the work
              </LinkButton>
            </div>
          </div>
        </section>

        <section id="services" className="relative overflow-hidden px-4 py-20 sm:px-6">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-16 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-golden-hour/25 blur-3xl"
          />
          <div className="relative mx-auto max-w-[1200px] text-center">
            <p className="text-caption uppercase tracking-wide text-warm-text">What we do</p>
            <h2 className="text-headline mx-auto mt-3 max-w-xl text-ink">
              Everything you need to <Highlight>stand out</Highlight>
            </h2>

            <div className="mt-6 grid grid-cols-3 gap-2 sm:mt-10 sm:gap-6">
              {SERVICES.map((service) => (
                <div
                  key={service.title}
                  className="flex flex-col items-center rounded-xl bg-espresso p-2 text-center sm:p-6"
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full sm:h-14 sm:w-14 ${service.accent}`}
                  >
                    <span className="[&_svg]:h-4 [&_svg]:w-4 sm:[&_svg]:h-[26px] sm:[&_svg]:w-[26px]">
                      {service.icon}
                    </span>
                  </div>
                  <p
                    className="mt-1.5 text-[11px] font-bold leading-tight text-golden-hour sm:mt-4 sm:text-subhead"
                    style={{ textShadow: "0 1px 3px rgba(0,0,0,0.6), 0 0 14px rgba(241,207,159,0.4)" }}
                  >
                    {service.title}
                  </p>
                  <p
                    className="mt-1 text-[13px] leading-snug text-golden-hour/75 sm:mt-2 sm:text-body"
                    style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
                  >
                    {service.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="relative overflow-hidden bg-burgundy px-4 py-20 sm:px-6">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-lavender-dusk/40 blur-3xl"
          />
          <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-3 text-center">
            <p className="text-caption uppercase tracking-wide text-golden-hour/70">About us</p>
            <span className="text-script-accent text-marker-purple">B&amp;E</span>
            <h2 className="text-headline">
              <Highlight variant="white">Bruce &amp; Elena</Highlight>
            </h2>
            <p
              className="max-w-xl text-body text-golden-hour/85"
              style={{ textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}
            >
              We love camera work — it&apos;s our passion and we love helping people. Our brand is
              built off our skills and talent used to help people reach success. Marketing leads
              to growth — social media — followers — motivation — profits. All connect &amp; help
              to build the next big path. For success. We want everyone in the world to succeed —
              we are all family in this infinite universe.
            </p>

            {/*
              No background box at all — any box, no matter how softly it
              fades, still reads as a shape with an edge. Instead the images
              themselves are inverted (black ink on white -> white ink on
              black) and blended with `screen`: screen blend makes black
              areas act fully transparent and white areas render at full
              opacity, so the former white paper disappears entirely and
              only the ink strokes show, now in white, sitting directly on
              the burgundy with nothing behind them to blend or border.
            */}
            <div className="mt-4 flex items-center gap-6 sm:gap-10">
              {/*
                Plain <img>, not next/image: these small signature files were
                intermittently failing to show up on mobile when loaded
                through Next's dev-mode /_next/image optimization endpoint
                (same class of issue as the cross-origin dev-resource
                blocking hit earlier) — a raw <img> bypasses that pipeline
                entirely, matching how the header logo and hero poster are
                already served for the same reliability reason.
              */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/signatures/bruce-signature.png"
                alt="Bruce's signature"
                className="h-auto w-28 invert mix-blend-screen sm:w-40"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/signatures/elena-signature.webp"
                alt="Elena's signature"
                className="h-auto w-[149px] invert mix-blend-screen sm:w-[213px]"
              />
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden px-4 py-20 sm:px-6">
          <div
            aria-hidden
            className="pointer-events-none absolute -left-16 top-10 h-56 w-56 rounded-full bg-golden-hour/25 blur-3xl"
          />
          <div className="relative mx-auto flex max-w-[1200px] flex-col items-center text-center">
            <p className="text-eyebrow uppercase text-ink">Gallery</p>
            <h2 className="text-headline mt-5 text-ink">Recent work</h2>
            <LinkButton href="/portfolio" variant="secondary" className="mt-6">
              See the full portfolio
            </LinkButton>

            <div className="mt-10 w-full">
              <PortfolioGrid limit={6} />
            </div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6">
          <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-6 text-center">
            <p className="text-eyebrow uppercase text-ink">Family</p>
            <h2 className="text-headline max-w-xl text-ink">THE MEDIA VAULT</h2>
            <p className="max-w-lg text-body text-ink-muted">
              Every family gets a private safe deposit for finished galleries, edits, clips,
              photos and videos. Type your password here to access.
            </p>
            <LinkButton href="/clients">Visit your Media Vault</LinkButton>
          </div>

          <div className="relative mx-auto mt-10 aspect-[16/9] max-w-[1200px] overflow-hidden rounded-xl">
            <Image
              src="/client-work-vault.webp"
              alt="A bank vault door, representing each family's private Media Vault"
              fill
              sizes="(min-width: 1200px) 1200px, 100vw"
              className="object-cover"
            />
          </div>
        </section>

        <section id="quote" className="relative overflow-hidden px-4 py-20 sm:px-6">
          <div
            aria-hidden
            className="pointer-events-none absolute right-1/2 bottom-0 h-64 w-64 translate-x-1/2 translate-y-1/3 rounded-full bg-marker-purple/10 blur-3xl"
          />
          <div className="relative mx-auto max-w-[900px]">
            <div className="text-center">
              <p className="text-caption uppercase tracking-wide text-warm-text">Get started</p>
              <h2 className="text-headline mt-3 text-ink">Let&apos;s build together</h2>
              <p className="mx-auto mt-4 max-w-lg text-body text-ink-muted">
                Picture the win, we&apos;ll get you there.
              </p>
            </div>

            <div className="mt-10">
              <QuoteForm />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
