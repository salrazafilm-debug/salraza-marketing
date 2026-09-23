# Salraza Marketing

Next.js site for Salraza Marketing: cinematic hero video intro, services, portfolio,
a quote-request form, and password-protected client workspaces.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Configuration

Copy `.env.example` to `.env.local` and fill in:

- `SESSION_SECRET` — required before deploying to production. Generate one with
  `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
- `RESEND_API_KEY` — optional. Without it, quote-form submissions are only logged to
  the server console instead of emailed. Sign up at https://resend.com for a free key.
- `RESEND_FROM_EMAIL` / `QUOTE_TO_EMAIL` — sender/recipient for quote-form emails.
- `NEXT_PUBLIC_SITE_URL` — your live domain (no trailing slash), used in Open Graph
  tags, the sitemap and robots.txt.

## Client workspaces

Clients are defined in `src/lib/clients.ts`. Each has a `slug`, a `passwordHash`
(never a plaintext password) and a `media` list of placeholder deliverables.

**To add a client or change a password:**

```bash
node scripts/hash-password.mjs "the new password"
```

Paste the printed `salt:hash` string into that client's `passwordHash` in
`src/lib/clients.ts`, and give the plaintext password to the client directly (not
over an insecure channel).

**Demo credentials** (`sample-client` is still a placeholder — change before sharing):

- `dmv-marksmen` → password `Marksmen.Salraza`
- `sample-client` → password `sample2026`

**To add real photos/videos to a client's workspace:**

1. Drop the image files into `public/clients/<slug>/` (create the folder if it
   doesn't exist yet), e.g. `public/clients/dmv-marksmen/game-day-01.jpg`. For a
   video deliverable, add a still frame/thumbnail image here too (an actual video
   player isn't wired up yet — this just shows a poster with a play icon).
2. In `src/lib/clients.ts`, add an `src` pointing to that path on the matching
   `media` entry, e.g. `{ type: "image", label: "Game day gallery", src: "/clients/dmv-marksmen/game-day-01.jpg" }`.
   Entries without `src` still show as a placeholder card (useful for listing
   what's coming before it's ready).
3. Keep images reasonably sized for the web (under ~500KB, ~1800px on the long
   edge is plenty) — ask your assistant to resize/compress if you're not sure how.
4. Commit and push; Vercel redeploys automatically.

Large video *files* (not thumbnails) don't belong in `public/` — for an actual
client-facing video player, that needs an external host (e.g. Mux, Cloudflare
Stream, or even a plain link to a private YouTube/Vimeo upload) rather than
self-hosting through this repo.

## Brand assets

Logos, fonts and the hero video live in `public/` and `src/app/fonts.ts`, sourced
from the Salraza Marketing brand kit. Color and type tokens are defined in
`src/app/globals.css`.

## Deploying

Built for [Vercel](https://vercel.com):

1. Push this repo to GitHub (or GitLab/Bitbucket).
2. Import it at https://vercel.com/new — it detects Next.js automatically, no
   config needed.
3. In the project's Vercel settings, add the environment variables from
   `.env.example` (real values, not the placeholders) for both Production and
   Preview environments.
4. In Vercel's "Domains" tab, either buy a domain directly or add one you already
   own (Vercel gives you the exact DNS records to add at your registrar).
5. Once the domain is attached, set `NEXT_PUBLIC_SITE_URL` to it and redeploy so
   the sitemap/Open Graph tags point at the real URL instead of the vercel.app one.
6. Change the demo client passwords in `src/lib/clients.ts` before sharing the
   site publicly (see "Client workspaces" above).

Favicon (`src/app/icon.png`), the social-share preview image
(`src/app/opengraph-image.jpg`), `robots.ts` and `sitemap.ts` are already wired up
via Next.js's file-based metadata conventions — no extra setup needed.
