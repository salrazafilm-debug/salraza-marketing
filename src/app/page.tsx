import Image from "next/image";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { HeroVideo } from "@/components/HeroVideo";
import { Highlight } from "@/components/Highlight";
import { LinkButton } from "@/components/Button";
import { PortfolioGrid } from "@/components/PortfolioGrid";
import { QuoteForm } from "@/components/QuoteForm";

const SERVICES = [
  {
    title: "Social media management",
    body: "Content that sounds like you, posted on a plan you never have to think about.",
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
    title: "Short-form video",
    body: "Videos optimized for high performing views, followers, and comments! Grow your page!",
    accent: "bg-white text-red-600",
    icon: (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="20" height="16" rx="2" />
        <path d="M11 10l6 3-6 3z" fill="currentColor" stroke="none" />
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

        <section id="about" className="relative overflow-hidden bg-cream px-4 py-20 sm:px-6">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-lavender-dusk/30 blur-3xl"
          />
          <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-3 text-center">
            <p className="text-caption uppercase tracking-wide text-warm-text">About us</p>
            <span className="text-script-accent text-marker-purple">B&amp;E</span>
            <h2 className="text-headline text-ink">Bruce &amp; Elena</h2>
            <p className="max-w-xl text-body text-ink-muted">
              We&apos;re passionate and motivated to help you grow. Your story matters to us and
              we&apos;re in this with you — to the future success.
            </p>

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
                className="h-auto w-28 mix-blend-multiply sm:w-40"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/signatures/elena-signature.webp"
                alt="Elena's signature"
                className="h-auto w-[149px] mix-blend-multiply sm:w-[213px]"
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
            <p className="text-caption uppercase tracking-wide text-warm-text">Portfolio</p>
            <h2 className="text-headline mt-3 text-ink">Recent work</h2>
            <LinkButton href="/portfolio" variant="secondary" className="mt-6">
              See the full portfolio
            </LinkButton>

            <div className="mt-10 w-full">
              <PortfolioGrid limit={6} />
            </div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6">
          <h2 className="text-headline mb-8 text-center text-ink">Family work</h2>
          <div className="relative mx-auto max-w-[1200px] overflow-hidden rounded-xl">
            <Image
              src="/client-work-vault.webp"
              alt=""
              aria-hidden
              fill
              sizes="(min-width: 1200px) 1200px, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-espresso/75" />
            <div className="relative flex flex-col items-center gap-6 px-6 py-14 text-center sm:px-14">
              <h2
                className="text-headline max-w-xl text-golden-hour"
                style={{ textShadow: "0 2px 4px rgba(0,0,0,0.5), 0 8px 24px rgba(0,0,0,0.45)" }}
              >
                THE VAULT
              </h2>
              <p
                className="max-w-lg text-body font-semibold text-golden-hour"
                style={{ textShadow: "0 1px 2px rgba(0,0,0,0.85), 0 2px 10px rgba(0,0,0,0.7)" }}
              >
                Every family gets a private safe deposit for finished galleries, edits, clips,
                photos and videos. Type your password here to access.
              </p>
              <LinkButton href="/clients">Visit your vault</LinkButton>
            </div>
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
                Tell us about your business and where you want to go. We&apos;ll take it from
                there.
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
