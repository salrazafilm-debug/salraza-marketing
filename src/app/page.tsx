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
    accent: "bg-golden-hour/40 text-warm-text",
    icon: (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="20" height="14" rx="2" />
        <path d="M8 22h10M13 18v4" />
      </svg>
    ),
  },
  {
    title: "Photography",
    body: "We capture moments and freeze them in time forever.",
    accent: "bg-lavender-dusk/30 text-purple-text",
    icon: (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 8h4l2-3h8l2 3h4v13H3z" />
        <circle cx="13" cy="14" r="4" />
      </svg>
    ),
  },
  {
    title: "Short-form video",
    body: "Shot, edited and posted — reels and clips built to get your story out there.",
    accent: "bg-marker-purple/15 text-marker-purple",
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
                  className="flex flex-col items-center rounded-xl bg-paper-raised p-2 text-center sm:p-6"
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full sm:h-14 sm:w-14 ${service.accent}`}
                  >
                    <span className="[&_svg]:h-4 [&_svg]:w-4 sm:[&_svg]:h-[26px] sm:[&_svg]:w-[26px]">
                      {service.icon}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[11px] font-bold leading-tight text-ink sm:mt-4 sm:text-subhead">
                    {service.title}
                  </p>
                  <p className="mt-1 text-[9.5px] leading-snug text-ink-muted sm:mt-2 sm:text-body">
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
              We&apos;re passionate and motivated to help you grow. Your story matters to us, and
              we&apos;re in this with you — all the way, every time.
            </p>
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
          <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-6 rounded-xl bg-lavender-dusk px-6 py-14 text-center sm:px-14">
            <p className="text-caption uppercase tracking-wide text-on-highlighter/70">
              Client work
            </p>
            <h2 className="text-headline max-w-xl text-on-highlighter">
              Your <Highlight>dedicated</Highlight> workspace
            </h2>
            <p className="max-w-lg text-body text-on-highlighter/80">
              Every client gets a private space for finished galleries, edits and clips — just
              your password away.
            </p>
            <LinkButton href="/clients">Visit your workspace</LinkButton>
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
