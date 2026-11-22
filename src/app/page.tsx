import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { PortfolioGrid } from "@/components/PortfolioGrid";
import { QuoteForm } from "@/components/QuoteForm";
import { IntroLoader } from "@/components/cinema/IntroLoader";
import { RecBar } from "@/components/cinema/RecBar";
import { PHOTOS } from "@/components/cinema/photos";
import { HomeSections } from "@/components/site/HomeSections";
import { getHomepageLayout } from "@/lib/site-layout";

// Reads the portfolio and the editable layout from the database — render
// per-request so admin changes show up immediately.
export const dynamic = "force-dynamic";

const PRELOAD = PHOTOS.map((p) => p.src);

export default async function Home() {
  const layout = await getHomepageLayout();
  return (
    <>
      <IntroLoader preload={PRELOAD} />
      <SiteHeader revealImmediately />
      <main className="overflow-x-clip">
        <HomeSections layout={layout} slots={{ gallery: <PortfolioGrid limit={6} />, quote: <QuoteForm /> }} />
      </main>
      <Footer />
      <RecBar />
    </>
  );
}
