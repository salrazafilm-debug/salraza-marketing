// Real Salraza photos already in /public, reused by every lab mock-up.
// "src" is the full-size original; "thumb" is a small WebP (about 700px,
// 30-90 KB) used for everything shown on the homepage so the browser never
// has to decode and scale 1800px images while animating.
const RAW = [
  { src: "/portfolio/stadium-lights.jpg", title: "Stadium lights" },
  { src: "/portfolio/soccer-huddle.jpg", title: "Soccer huddle" },
  { src: "/portfolio/festival-fireworks.jpg", title: "Festival fireworks" },
  { src: "/portfolio/crew-team-photo.jpg", title: "Crew day" },
  { src: "/portfolio/volleyball-game.jpg", title: "Volleyball night" },
  { src: "/portfolio/catering-event.jpg", title: "Catering event" },
  { src: "/portfolio/marksmen-handshake.jpg", title: "Marksmen handshake" },
  { src: "/portfolio/lady-marksmen-jerseys.jpg", title: "Lady Marksmen" },
  { src: "/portfolio/marksmen-boys-jerseys.jpg", title: "Marksmen boys" },
];

export const PHOTOS = RAW.map((p) => ({
  ...p,
  thumb: p.src.replace("/portfolio/", "/portfolio/thumb/").replace(/\.jpe?g$/i, ".webp"),
}));

/** The caption for a photo URL, if it's one of the built-in photos. */
export function photoTitle(url: string): string {
  return PHOTOS.find((p) => p.thumb === url || p.src === url)?.title ?? "";
}

export const SERVICES = [
  "Social media management",
  "Photography",
  "Short-form video",
  "Website creation",
  "Branding & logo",
  "Brand refresh",
];
