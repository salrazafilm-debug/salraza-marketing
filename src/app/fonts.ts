import localFont from "next/font/local";

export const unbounded = localFont({
  src: [
    { path: "./fonts/Unbounded-ExtraBold.woff2", weight: "800", style: "normal" },
    { path: "./fonts/Unbounded-Black.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-unbounded",
  display: "swap",
});

export const bricolage = localFont({
  src: [
    { path: "./fonts/BricolageGrotesque-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/BricolageGrotesque-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-bricolage",
  display: "swap",
});

export const caveatBrush = localFont({
  src: [{ path: "./fonts/CaveatBrush-Regular.woff2", weight: "400", style: "normal" }],
  variable: "--font-caveat-brush",
  display: "swap",
});
