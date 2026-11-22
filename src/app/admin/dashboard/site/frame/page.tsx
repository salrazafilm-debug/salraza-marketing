import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/admin-session";
import { getHomepageLayout } from "@/lib/site-layout";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { PortfolioGrid } from "@/components/PortfolioGrid";
import { QuoteForm } from "@/components/QuoteForm";
import { DraftFrame } from "@/components/site/DraftFrame";
import { RecBar } from "@/components/cinema/RecBar";

export const metadata: Metadata = { title: "Phone preview", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Loaded inside the editor's phone-sized frame; shows the unsaved draft. */
export default async function DraftFramePage() {
  const cookieStore = await cookies();
  if (!verifyAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)) {
    redirect("/admin");
  }
  const layout = await getHomepageLayout();
  return (
    <>
      <SiteHeader revealImmediately />
      <main className="overflow-x-clip">
        <DraftFrame saved={layout} slots={{ gallery: <PortfolioGrid limit={6} />, quote: <QuoteForm /> }} />
      </main>
      <Footer />
      <RecBar />
    </>
  );
}
