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
  const siteContent = await listSiteContent();
  const introText = siteContent[VAULT_INTRO_TEXT_KEY]?.value ?? DEFAULT_VAULT_INTRO_TEXT;

  return (
    <>
      <SiteHeader revealImmediately />
      <main className="flex min-h-[100svh] flex-col items-center justify-center bg-cream px-4 pt-40 pb-16 sm:px-6 sm:pt-36">
        {/* The torn-paper card. */}
        <div className="relative z-10 mx-auto w-full max-w-[480px]">
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
      </main>
      <Footer />
    </>
  );
}
