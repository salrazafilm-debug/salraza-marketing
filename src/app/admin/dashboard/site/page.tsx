import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/admin-session";
import { getHomepageDraft, getHomepageLayout } from "@/lib/site-layout";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { PortfolioGrid } from "@/components/PortfolioGrid";
import { QuoteForm } from "@/components/QuoteForm";
import { SiteEditor } from "@/components/site/SiteEditor";

export const metadata: Metadata = {
  title: "Edit homepage",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function SiteEditorPage() {
  const cookieStore = await cookies();
  if (!verifyAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)) {
    redirect("/admin");
  }
  const [draft, published] = await Promise.all([getHomepageDraft(), getHomepageLayout()]);

  return (
    <>
      <SiteHeader revealImmediately />
      <main className="overflow-x-clip pb-28 pt-16">
        <SiteEditor initial={draft} published={published} slots={{ gallery: <PortfolioGrid limit={6} />, quote: <QuoteForm /> }} />
      </main>
      <Footer />
    </>
  );
}
