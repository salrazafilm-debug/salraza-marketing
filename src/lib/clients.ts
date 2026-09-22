export type MediaItem = {
  type: "image" | "video";
  label: string;
  caption?: string;
};

export type Client = {
  slug: string;
  name: string;
  /** A `salt:hash` string produced by hashPassword() in lib/password.ts — never a plaintext password. */
  passwordHash: string;
  welcomeNote: string;
  media: MediaItem[];
};

/**
 * Placeholder client workspaces. Replace passwordHash values with your own —
 * run `node scripts/hash-password.mjs "the new password"` to generate one —
 * and swap the media list once real deliverables are ready.
 */
export const CLIENTS: Client[] = [
  {
    slug: "dmv-marksmen",
    name: "DMV Marksmen",
    passwordHash:
      "f55f3bbea5933f76da28a264f13ce9d0:0c9d164a86f396dd24a41b72db5724828a5de91ed2a2849a7e261d944a620c787cb7a818b7313c692bfb3373b2035c2cce07d8d54a73abc094d5b32736dc836a",
    welcomeNote: "So proud of this family. This is just the start.",
    media: [
      { type: "video", label: "Season highlight reel — final cut", caption: "Delivered · 2:14" },
      { type: "image", label: "Game day gallery — set 01", caption: "48 photos" },
      { type: "image", label: "Team portraits", caption: "22 photos" },
      { type: "video", label: "Social teaser cut", caption: "0:32" },
    ],
  },
  {
    slug: "sample-client",
    name: "Sample Client",
    passwordHash:
      "b7e5a25c9fa6c74b7c8c29fc58d0c29a:0d2981ac1cc9a8366315440aa057824ecb440fc164afb2dff947e561fd12d64d356bf819a1bb5547345f3ba085bce3742a5b2d66d9371b0bf163999ea6dc98a3",
    welcomeNote: "Welcome to your workspace — everything we finish for you lands here.",
    media: [
      { type: "image", label: "Brand shoot — set 01", caption: "Coming soon" },
      { type: "video", label: "Launch video — final cut", caption: "Coming soon" },
    ],
  },
];

export function findClientBySlug(slug: string): Client | undefined {
  return CLIENTS.find((client) => client.slug === slug);
}
