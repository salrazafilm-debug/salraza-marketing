import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { findClientBySlug } from "@/lib/clients";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { LogoutButton } from "@/components/LogoutButton";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const client = findClientBySlug(slug);
  if (!client) notFound();

  const cookieStore = await cookies();
  const sessionSlug = verifySession(cookieStore.get(SESSION_COOKIE)?.value);
  if (sessionSlug !== slug) {
    redirect("/clients?error=session");
  }

  return (
    <>
      <SiteHeader revealImmediately />
      <main className="min-h-[100svh] px-4 pt-28 pb-20 sm:px-6">
        <div className="mx-auto max-w-[1200px]">
          <div className="flex flex-col gap-4 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-caption uppercase tracking-wide text-warm-text">
                {client.name}&apos;s workspace
              </p>
              <h1 className="text-headline mt-2 text-ink">{client.welcomeNote}</h1>
            </div>
            <LogoutButton />
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {client.media.map((item) => (
              <div
                key={item.label}
                className="flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-xl bg-lavender-dusk p-6"
              >
                <span className="text-on-highlighter/80">
                  {item.type === "video" ? (
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="2" y="6" width="24" height="16" rx="3" />
                      <path d="M11 11l6 3-6 3z" fill="currentColor" stroke="none" />
                    </svg>
                  ) : (
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="2" y="4" width="24" height="20" rx="3" />
                      <circle cx="9" cy="11" r="2.5" />
                      <path d="M4 21l7-7 4 4 5-6 4 5" />
                    </svg>
                  )}
                </span>
                <p className="text-subhead mt-4 text-on-highlighter">{item.label}</p>
                {item.caption && (
                  <p className="text-caption mt-1 text-on-highlighter/70">{item.caption}</p>
                )}
              </div>
            ))}
          </div>

          <p className="mt-10 text-caption">
            Don&apos;t see something you were expecting? Email us at{" "}
            <a href="mailto:salraza.film@gmail.com" className="focus-brand text-purple-text underline">
              salraza.film@gmail.com
            </a>{" "}
            and we&apos;ll get it added.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
