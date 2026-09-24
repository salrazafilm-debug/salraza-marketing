import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets the dev server (HMR, JS chunks) load when this machine is opened
  // from another device on the LAN, e.g. testing the site on a phone via
  // http://<this-machine's-LAN-IP>:3000 — otherwise Next.js blocks those
  // cross-origin dev requests by default, hydration never finishes, and
  // client components (like the hero video's autoplay) silently never run.
  allowedDevOrigins: ["192.168.1.179"],
  // Client deliverables (photos/videos uploaded through /admin) are served
  // from Cloudinary, not /public, so next/image needs this domain allowed.
  images: {
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
};

export default nextConfig;
