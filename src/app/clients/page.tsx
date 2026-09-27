import type { Metadata } from "next";
import Image from "next/image";
import { ClientLoginForm } from "@/components/ClientLoginForm";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { DEFAULT_VAULT_INTRO_TEXT, VAULT_INTRO_TEXT_KEY, listSiteContent } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Media Vault — Salraza Marketing",
  description: "Enter your Media Vault password to view your dedicated Salraza Marketing gallery.",
};

const FEATURES = [
  {
    title: "Galleries",
    icon: (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="6" width="16" height="14" rx="2" />
        <rect x="7" y="2" width="16" height="14" rx="2" />
        <circle cx="11" cy="13" r="2" />
      </svg>
    ),
  },
  {
    title: "Edits",
    icon: (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 22l4-1 12-12-3-3L5 18z" />
        <path d="M15 6l3-3 3 3-3 3z" />
      </svg>
    ),
  },
  {
    title: "Photos + Video",
    icon: (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 8h4l2-3h8l2 3h4v13H3z" />
        <path d="M10 12.5l4.5 2.5-4.5 2.5z" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    title: "Private & Secure",
    icon: (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 3l9 4v6c0 6-4 9.5-9 11-5-1.5-9-5-9-11V7z" />
        <path d="M9.5 13l2.3 2.3L17 10.5" />
      </svg>
    ),
  },
];

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const siteContent = await listSiteContent();
  const introText = siteContent[VAULT_INTRO_TEXT_KEY]?.value ?? DEFAULT_VAULT_INTRO_TEXT;

  return (
    <>
      <SiteHeader revealImmediately />
      <main className="min-h-[100svh] bg-cream">
        <section className="relative overflow-hidden px-4 pt-28 pb-14 sm:px-6">
          <Image
            src="/client-work-vault.webp"
            alt=""
            aria-hidden
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-[0.16]"
          />
          <div className="pointer-events-none absolute inset-0 bg-cream/70" />

          {/* The torn-paper card. */}
          <div className="relative z-10 mx-auto max-w-[480px]">
            <div className="torn-paper relative bg-paper px-6 py-10 sm:px-10">
              <span className="tape absolute -top-3 left-1/2 h-7 w-20 -translate-x-1/2 -rotate-2" aria-hidden />

              <svg
                width="40"
                height="46"
                viewBox="0 0 48 56"
                fill="none"
                stroke="var(--color-marker-purple)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mx-auto -rotate-3"
                aria-hidden
              >
                <rect x="8" y="24" width="32" height="26" rx="4" />
                <path d="M14 24v-8a10 10 0 0 1 19-4" />
                <circle cx="24" cy="36" r="2.6" fill="var(--color-marker-purple)" stroke="none" />
                <path d="M24 39v4.5" />
              </svg>

              <h1 className="text-headline mt-3 text-center text-ink">
                Unlock your
                <br />
                <span className="highlight text-script-accent px-1">Media Vault</span>
              </h1>

              <p className="mx-auto mt-3 max-w-sm text-center text-body text-ink-muted">
                {introText}
              </p>

              <div className="mt-6">
                <ClientLoginForm
                  initialError={
                    error === "session" ? "Your session expired — please sign in again." : undefined
                  }
                />
              </div>
            </div>
          </div>
        </section>

        <section className="torn-paper-top relative bg-cream px-4 pb-20 pt-14 sm:px-6">
          <div className="mx-auto max-w-[1000px] text-center">
            <h2 className="text-script-accent relative inline-block text-ink">
              Finished galleries
              <span
                aria-hidden
                className="absolute -bottom-1 left-0 h-3 w-full -rotate-1 rounded-full bg-highlighter/80"
                style={{ zIndex: -1 }}
              />
            </h2>

            <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-8">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="flex flex-col items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-paper text-purple-text shadow-sm">
                    {feature.icon}
                  </div>
                  <p className="text-label text-ink">{feature.title}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
