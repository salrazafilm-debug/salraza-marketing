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

**Demo credentials** (placeholders — change before sharing the site):

- `dmv-marksmen` → password `family2026`
- `sample-client` → password `sample2026`

To swap in real deliverables, replace the `media` array entries and point them at
real files (e.g. upload to `public/clients/<slug>/` for small files, or an external
storage/CDN provider for video — the `public/` folder isn't a great fit for large
video files in production).

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
