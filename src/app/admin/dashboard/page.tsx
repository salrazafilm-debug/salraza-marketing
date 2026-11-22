import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/admin-session";
import { listClientSummaries } from "@/lib/clients";
import { listPortfolioItems } from "@/lib/portfolio";
import { DEFAULT_VAULT_INTRO_TEXT, VAULT_INTRO_TEXT_KEY, listSiteContent } from "@/lib/site-content";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { AdminLogoutButton } from "@/components/AdminLogoutButton";
import { CreateClientForm } from "@/components/CreateClientForm";
import { MediaVaultContentForm } from "@/components/MediaVaultContentForm";

export const metadata: Metadata = {
  title: "Admin dashboard — Salraza Marketing",
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage() {
  const cookieStore = await cookies();
  if (!verifyAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)) {
    redirect("/admin");
  }

  const clients = await listClientSummaries();
  const portfolioItems = await listPortfolioItems();
  const siteContent = await listSiteContent();
  const introText = siteContent[VAULT_INTRO_TEXT_KEY]?.value ?? DEFAULT_VAULT_INTRO_TEXT;

  return (
    <>
      <SiteHeader revealImmediately />
      <main className="min-h-[100svh] px-4 pt-28 pb-20 sm:px-6">
        <div className="mx-auto max-w-[1200px]">
          <div className="flex flex-col gap-4 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-warm-text">Admin · Salraza</p>
              <h1 className="title-lit mt-3 font-display text-4xl font-black uppercase sm:text-5xl">Control room</h1>
            </div>
            <AdminLogoutButton />
          </div>

          {/* The site editor: the main way to change the homepage. */}
          <Link
            href="/admin/dashboard/site"
            className="focus-brand group relative mt-8 flex flex-col gap-4 overflow-hidden rounded-2xl border border-line p-6 transition hover:border-spark sm:flex-row sm:items-center sm:justify-between sm:p-8"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{ background: "radial-gradient(ellipse 60% 120% at 0% 50%, color-mix(in srgb, var(--accent) 40%, transparent), transparent 70%)" }}
            />
            <div className="relative">
              <p className="text-xs uppercase tracking-[0.3em] text-warm-text">Website</p>
              <p className="title-lit mt-2 font-display text-2xl font-black uppercase sm:text-3xl">Edit the homepage</p>
              <p className="mt-2 max-w-xl text-sm text-ink-muted">
                See the real page, click any words to change them, and add, hide, reorder or delete sections.
                Preview it on a phone, then save to publish.
              </p>
            </div>
            <span className="relative w-fit rounded-full bg-spark px-6 py-3 text-xs font-bold uppercase tracking-[0.15em] text-[#160b0d] transition-colors group-hover:bg-accent group-hover:text-white">
              Open editor →
            </span>
          </Link>

          <div className="mt-10">
            <CreateClientForm />
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clients.map((client) => (
              <Link
                key={client.slug}
                href={`/admin/dashboard/${client.slug}`}
                className="focus-brand flex flex-col gap-2 rounded-xl border border-line bg-paper-raised/70 p-6 backdrop-blur transition hover:-translate-y-0.5 hover:border-spark"
              >
                <p className="text-subhead text-ink">{client.name}</p>
                <p className="text-caption mt-2 text-warm-text">
                  {client.mediaCount} {client.mediaCount === 1 ? "item" : "items"} uploaded
                </p>
              </Link>
            ))}

            {clients.length === 0 && (
              <p className="text-body text-ink-muted">No families yet — add your first one above.</p>
            )}
          </div>

          <div className="mt-10">
            <Link
              href="/admin/dashboard/portfolio"
              className="focus-brand flex items-center justify-between gap-4 rounded-xl border border-line bg-paper-raised/70 p-6 backdrop-blur transition hover:-translate-y-0.5 hover:border-spark"
            >
              <div>
                <p className="text-subhead text-ink">Portfolio</p>
                <p className="text-caption mt-2 text-warm-text">
                  {portfolioItems.length} {portfolioItems.length === 1 ? "photo" : "photos"} shown on
                  the public /portfolio page and homepage
                </p>
              </div>
              <span className="text-purple-text" aria-hidden>
                →
              </span>
            </Link>
          </div>

          <div className="mt-10 flex flex-col gap-6 rounded-xl border border-line bg-paper-raised/70 p-6 backdrop-blur">
            <div>
              <p className="text-subhead text-ink">Media Vault Page</p>
              <p className="text-caption mt-1 text-warm-text">
                The supporting text on the public /clients login page. The scrapbook design
                around it (tape, torn paper, the vault door, the lock doodle) is fixed and
                isn&apos;t edited here.
              </p>
            </div>

            <MediaVaultContentForm introText={introText} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
