import type { Metadata } from "next";
import { ClientLoginForm } from "@/components/ClientLoginForm";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Client work — Salraza Marketing",
  description: "Enter your vault password to view your dedicated Salraza Marketing gallery.",
};

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <>
      <SiteHeader revealImmediately />
      <main className="flex min-h-[100svh] flex-col justify-center px-4 pt-28 pb-20 sm:px-6">
        <div className="mx-auto w-full max-w-[1200px] text-center">
          <p className="text-caption uppercase tracking-wide text-warm-text">Client work</p>
          <h1 className="text-headline mt-3 text-ink">Visit your vault</h1>
          <p className="mx-auto mt-4 max-w-xl text-body text-ink-muted">
            Every family gets a private safe deposit for finished galleries, edits, photos and
            videos. Type your password here to access.
          </p>

          <div className="mt-10">
            <ClientLoginForm
              initialError={
                error === "session" ? "Your session expired — please sign in again." : undefined
              }
            />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
