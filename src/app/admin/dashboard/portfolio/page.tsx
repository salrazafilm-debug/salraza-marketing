import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/admin-session";
import { listPortfolioItems } from "@/lib/portfolio";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { AdminLogoutButton } from "@/components/AdminLogoutButton";
import { PortfolioUploader } from "@/components/PortfolioUploader";
import { PortfolioManager } from "@/components/PortfolioManager";

export const metadata: Metadata = {
  title: "Portfolio — Admin — Salraza Marketing",
  robots: { index: false, follow: false },
};

export default async function AdminPortfolioPage() {
  const cookieStore = await cookies();
  if (!verifyAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)) {
    redirect("/admin");
  }

  const items = await listPortfolioItems();

  return (
    <>
      <SiteHeader revealImmediately />
      <main className="min-h-[100svh] px-4 pt-28 pb-20 sm:px-6">
        <div className="mx-auto max-w-[1200px]">
          <div className="flex flex-col gap-4 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Link href="/admin/dashboard" className="focus-brand text-caption text-purple-text underline">
                ← Admin dashboard
              </Link>
              <h1 className="text-headline mt-2 text-ink">Portfolio</h1>
              <p className="text-caption mt-1 text-warm-text">
                Controls what shows on the public /portfolio page and the homepage gallery.
              </p>
            </div>
            <AdminLogoutButton />
          </div>

          <div className="mt-8 flex flex-col gap-8">
            <PortfolioUploader />
            <PortfolioManager items={items} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
