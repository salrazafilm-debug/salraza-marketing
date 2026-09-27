import type { Metadata } from "next";
import Image from "next/image";
import { ClientLoginForm } from "@/components/ClientLoginForm";
import { VaultPolaroid } from "@/components/VaultPolaroid";
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
  const photoMain = siteContent["vault-photo-main"]?.value ?? undefined;
  const photoCamera = siteContent["vault-photo-camera"]?.value ?? undefined;
  const photoBottomLeft = siteContent["vault-photo-bottom-left"]?.value ?? undefined;
  const captionMain = siteContent["vault-caption-main"]?.value ?? "";
  const captionCamera = siteContent["vault-caption-camera"]?.value ?? "";
  const captionBottomLeft = siteContent["vault-caption-bottom-left"]?.value ?? "";
  const introText = siteContent[VAULT_INTRO_TEXT_KEY]?.value ?? DEFAULT_VAULT_INTRO_TEXT;

  return (
    <>
      <SiteHeader revealImmediately />
      <main className="min-h-[100svh] bg-cream">
        <section className="relative overflow-hidden px-4 pt-28 pb-20 sm:px-6 sm:pt-32">
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

          <div className="relative mx-auto max-w-[900px]">
            {/* Mobile / tablet: a fanned row of photos above the card. */}
            <div className="mb-6 flex items-end justify-center gap-3 lg:hidden">
              <VaultPolaroid
                src={photoMain}
                alt="Main family photo"
                caption={captionMain}
                rotate={-8}
                tapeSide="top-left"
                className="h-[112px] w-[92px]"
              />
              <VaultPolaroid
                src={photoCamera}
                alt="Camera photo"
                caption={captionCamera}
                rotate={5}
                tapeSide="top"
                className="z-10 h-[132px] w-[108px]"
              />
              <VaultPolaroid
                src={photoBottomLeft}
                alt="Bottom-left photo"
                caption={captionBottomLeft}
                rotate={-4}
                tapeSide="top-right"
                className="h-[112px] w-[92px]"
              />
            </div>

            {/* Desktop: photos scattered around the card, layered underneath it. */}
            <div className="relative hidden lg:block">
              <div className="absolute -left-24 top-6 z-0">
                <VaultPolaroid
                  src={photoMain}
                  alt="Main family photo"
                  caption={captionMain}
                  rotate={-9}
                  tapeSide="top-left"
                  className="h-[198px] w-[160px]"
                />
              </div>
              <div className="absolute -right-28 top-0 z-0">
                <VaultPolaroid
                  src={photoCamera}
                  alt="Camera photo"
                  caption={captionCamera}
                  rotate={7}
                  tapeSide="top-right"
                  className="h-[184px] w-[150px]"
                />
              </div>
              <div className="absolute -left-16 bottom-6 z-0">
                <VaultPolaroid
                  src={photoBottomLeft}
                  alt="Bottom-left photo"
                  caption={captionBottomLeft}
                  rotate={-5}
                  tapeSide="top"
                  className="h-[172px] w-[140px]"
                />
              </div>
            </div>

            {/* The torn-paper card. */}
            <div className="relative z-10 mx-auto max-w-[560px]">
              <div className="torn-paper relative bg-paper px-6 py-12 sm:px-12 sm:py-16">
                <span className="tape absolute -top-3 left-1/2 h-7 w-20 -translate-x-1/2 -rotate-2" aria-hidden />

                <div className="absolute -right-6 -top-8 hidden -rotate-6 sm:block">
                  <div className="flex flex-col items-center gap-2 bg-burgundy px-4 py-3 text-center shadow-[0_10px_20px_rgba(0,0,0,0.25)]">
                    <p className="text-caption font-bold leading-snug text-golden-hour">
                      Photos + Video
                      <br />
                      + Edits
                      <br />
                      All in one place.
                    </p>
                  </div>
                </div>

                <svg
                  width="46"
                  height="54"
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

                <h1 className="text-headline mt-4 text-center text-ink">
                  Unlock your
                  <br />
                  <span className="highlight text-script-accent px-1">Media Vault</span>
                </h1>

                <p className="mx-auto mt-5 max-w-sm text-center text-body text-ink-muted">
                  {introText}
                </p>

                <div className="mx-auto mt-5 w-fit -rotate-1 bg-burgundy px-4 py-2.5 text-center shadow-[0_8px_16px_rgba(0,0,0,0.2)] sm:hidden">
                  <p className="text-caption font-bold leading-snug text-golden-hour">
                    Photos + Video + Edits + All in one place.
                  </p>
                </div>

                <div className="mt-8">
                  <ClientLoginForm
                    initialError={
                      error === "session" ? "Your session expired — please sign in again." : undefined
                    }
                  />
                </div>
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
