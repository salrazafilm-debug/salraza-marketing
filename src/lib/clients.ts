export type MediaItem = {
  type: "image" | "video";
  label: string;
  caption?: string;
  /**
   * Path under /public to the real photo, or a thumbnail/poster frame for a
   * video (e.g. "/clients/dmv-marksmen/game-day-01.jpg"). Leave unset for a
   * placeholder card — useful for listing deliverables that aren't ready yet.
   */
  src?: string;
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
 * Client workspaces. Replace passwordHash values with your own — run
 * `node scripts/hash-password.mjs "the new password"` to generate one — and
 * fill in real deliverables in `media` (see MediaItem.src) once they're ready.
 */
export const CLIENTS: Client[] = [
  {
    slug: "dmv-marksmen",
    name: "DMV Marksmen",
    // Password: Marksmen.Salraza
    passwordHash:
      "8354387e1679df953bf93266e5a9cd5d:753125e23f262f2d63e3b03bb89c125e68deca8d495bde3c2249f9d25d7ff2832916bc755ec57001d351c7364c3437a303481de77d6ce60c97a8bff0dd3735a4",
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
