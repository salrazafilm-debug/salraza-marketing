import type { Metadata } from "next";
import { unbounded, bricolage, caveatBrush } from "./fonts";
import Script from "next/script";
import "./globals.css";
import { FilmGrain, SiteAtmosphere } from "@/components/cinema/SiteAtmosphere";
import { MODE_BOOT_SCRIPT } from "@/components/cinema/mode";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const title = "Salraza Marketing — Social media, photography & video";
const description =
  "Salraza Marketing is Bruce and Elena: social media management, photography and short-form video. We treat clients like family and take them as far as they can go.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: "%s — Salraza Marketing",
  },
  description,
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: "Salraza Marketing",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-mode="dark"
      suppressHydrationWarning
      className={`${unbounded.variable} ${bricolage.variable} ${caveatBrush.variable} antialiased`}
    >
      <body>
        {/* Keeps the site in dark mode (see cinema/mode.ts). */}
        <Script id="salraza-mode" strategy="beforeInteractive">
          {MODE_BOOT_SCRIPT}
        </Script>
        <SiteAtmosphere />
        <FilmGrain />
        {children}
      </body>
    </html>
  );
}
