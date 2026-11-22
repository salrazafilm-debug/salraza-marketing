/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import { ClientLoginForm } from "@/components/ClientLoginForm";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { DEFAULT_VAULT_INTRO_TEXT, VAULT_INTRO_TEXT_KEY, listSiteContent } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Media Vault — Salraza Marketing",
  description: "Enter your Media Vault password to view your dedicated Salraza Marketing gallery.",
};

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  // If the database is unreachable the login still works with the default words.
  const siteContent = await listSiteContent().catch(() => ({}) as Awaited<ReturnType<typeof listSiteContent>>);
  const introText = siteContent[VAULT_INTRO_TEXT_KEY]?.value ?? DEFAULT_VAULT_INTRO_TEXT;

  return (
    <>
      <SiteHeader revealImmediately />
      <main className="relative flex min-h-[100svh] items-center justify-center overflow-hidden px-4 pb-16 pt-32 sm:px-6">
        {/* Cinematic backdrop: the work itself, dimmed, with a warm glow. */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <img src="/client-work-vault.webp" alt="" className="h-full w-full scale-110 object-cover opacity-30 blur-sm [filter:sepia(.3)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-paper via-paper/80 to-paper" />
          <div
            className="absolute inset-0"
            style={{ background: "radial-gradient(ellipse 50% 45% at 50% 45%, color-mix(in srgb, var(--accent) 35%, transparent), transparent 70%)" }}
          />
        </div>

        <div className="relative z-10 w-full max-w-[440px]">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-warm-text">For our clients</p>
            <h1 className="mt-3 font-display text-4xl font-black uppercase leading-[0.98] text-ink sm:text-5xl">
              Media <span className="title-lit">Vault</span>
            </h1>
            <p className="mx-auto mt-4 max-w-sm text-base text-ink/75">{introText}</p>
          </div>

          {/* A light card so the form stands out and reads easily. */}
          <div
            data-mode="light"
            className="mt-8 rounded-2xl bg-[#fbf7f2] p-6 text-ink shadow-[0_50px_100px_-40px_rgba(20,4,10,.8)] ring-1 ring-black/5 sm:p-8"
          >
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5c84c] text-[#160b0d]">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                  <rect x="4" y="9" width="12" height="9" rx="2" />
                  <path d="M7 9V6a3 3 0 0 1 6 0v3" />
                </svg>
              </span>
              <div>
                <p className="font-display text-base font-black uppercase leading-tight">Unlock your gallery</p>
                <p className="text-xs text-ink/60">Photos, videos and edits — private to you.</p>
              </div>
            </div>
            <ClientLoginForm
              initialError={error === "session" ? "Your session expired — please sign in again." : undefined}
            />
          </div>
          <p className="mt-5 text-center text-xs text-ink/55">Lost your password? Message us and we&apos;ll send it again.</p>
        </div>
      </main>
      <Footer />
    </>
  );
}
