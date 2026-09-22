import type { Metadata } from "next";
import { unbounded, bricolage, caveatBrush } from "./fonts";
import "./globals.css";

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
      className={`${unbounded.variable} ${bricolage.variable} ${caveatBrush.variable} antialiased`}
    >
      <body>{children}</body>
    </html>
  );
}
