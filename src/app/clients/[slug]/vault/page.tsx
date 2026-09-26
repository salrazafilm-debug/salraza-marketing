import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { findClientBySlug, type MediaItem } from "@/lib/clients";
import { MARKSMEN_SLUG } from "@/lib/clientConstants";
import { getDownloadUrl, getVideoThumbnailUrl } from "@/lib/cloudinary";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { LogoutButton } from "@/components/LogoutButton";
import { MarksmenVaultIntro } from "@/components/MarksmenVaultIntro";
import { RevealSection } from "@/components/RevealSection";
import { TypewriterText } from "@/components/TypewriterText";

/**
 * A real download, not just "open the file": links to a Cloudinary URL with
 * the fl_attachment flag, which makes Cloudinary's own response include a
 * Content-Disposition: attachment header. That's what makes this reliable
 * on mobile browsers too — a plain <a download> on a cross-origin file like
 * this often just opens it in a new tab instead of saving it.
 */
function DownloadButton({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      download
      aria-label={`Download ${label}`}
      className="focus-brand absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-espresso/70 text-golden-hour backdrop-blur transition hover:bg-espresso/90"
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 2.5v9.5M5 8.5l4 4 4-4" />
        <path d="M2.5 14.5v1a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-1" />
      </svg>
    </a>
  );
}

function MediaGrid({ items }: { items: MediaItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) =>
        item.type === "video" ? (
          <div
            key={item.id}
            className="relative flex flex-col overflow-hidden rounded-xl bg-espresso"
          >
            <video
              controls
              preload="none"
              poster={getVideoThumbnailUrl(item.cloudinaryPublicId)}
              className="aspect-[4/5] w-full bg-black object-contain"
            >
              <source src={item.src} />
            </video>
            <DownloadButton href={getDownloadUrl(item.src, item.label)} label={item.label} />
            <div className="p-4 sm:p-6">
              <p className="text-subhead text-paper">{item.label}</p>
              {item.caption && <p className="text-caption mt-1 text-golden-hour/80">{item.caption}</p>}
            </div>
          </div>
        ) : (
          <div
            key={item.id}
            className="relative flex flex-col overflow-hidden rounded-xl bg-espresso"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.src} alt={item.label} className="block h-auto w-full" />
            <DownloadButton href={getDownloadUrl(item.src, item.label)} label={item.label} />
            <div className="p-4 sm:p-6">
              <p className="text-subhead text-paper">{item.label}</p>
              {item.caption && <p className="text-caption mt-1 text-golden-hour/80">{item.caption}</p>}
            </div>
          </div>
        )
      )}
    </div>
  );
}

export default async function VaultPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ intro?: string }>;
}) {
  const { slug } = await params;
  const { intro } = await searchParams;
  const client = await findClientBySlug(slug);
  if (!client) notFound();

  const cookieStore = await cookies();
  const sessionSlug = verifySession(cookieStore.get(SESSION_COOKIE)?.value);
  if (sessionSlug !== slug) {
    redirect("/clients?error=session");
  }

  const showIntro = slug === MARKSMEN_SLUG && intro === "1";
  let step = 0;

  return (
    <>
      <SiteHeader revealImmediately />
      <main className="min-h-[100svh] px-4 pt-28 pb-20 sm:px-6">
        <MarksmenVaultIntro introSrc={showIntro ? "/clients/dmv-marksmen/login-intro.mp4" : null}>
          <div className="mx-auto max-w-[1200px]">
            <RevealSection index={step++}>
              <div className="flex flex-col gap-4 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-caption uppercase tracking-wide text-warm-text">
                    {client.name}
                  </p>
                  <h1 className="text-headline mt-2 text-ink">
                    <TypewriterText text={client.welcomeNote} />
                  </h1>
                </div>
                <LogoutButton />
              </div>
            </RevealSection>

            {client.media.length === 0 ? (
              <RevealSection index={step++}>
                <div className="mt-10 flex flex-col items-center gap-2 rounded-xl bg-cream px-6 py-14 text-center">
                  <p className="text-subhead text-ink">Nothing here yet</p>
                  <p className="max-w-sm text-body text-ink-muted">
                    We&apos;re still finishing your gallery — check back soon.
                  </p>
                </div>
              </RevealSection>
            ) : (
              <div className="mt-10 flex flex-col gap-10">
                {client.folders.map((folder) => {
                  const folderItems = client.media.filter((item) => item.folderId === folder.id);
                  if (folderItems.length === 0) return null;
                  return (
                    <RevealSection key={folder.id} index={step++}>
                      <div className="flex flex-col gap-4">
                        <h2 className="text-subhead text-ink">{folder.name}</h2>
                        <MediaGrid items={folderItems} />
                      </div>
                    </RevealSection>
                  );
                })}

                {(() => {
                  const ungrouped = client.media.filter((item) => !item.folderId);
                  if (ungrouped.length === 0) return null;
                  return (
                    <RevealSection index={step++}>
                      <div className="flex flex-col gap-4">
                        {client.folders.length > 0 && (
                          <h2 className="text-subhead text-ink">More</h2>
                        )}
                        <MediaGrid items={ungrouped} />
                      </div>
                    </RevealSection>
                  );
                })()}
              </div>
            )}

            <RevealSection index={step++}>
              <p className="mt-10 text-caption">
                Don&apos;t see something you were expecting? Email us at{" "}
                <a
                  href="mailto:salraza.film@gmail.com"
                  className="focus-brand text-purple-text underline"
                >
                  salraza.film@gmail.com
                </a>{" "}
                and we&apos;ll get it added.
              </p>
            </RevealSection>
          </div>
        </MarksmenVaultIntro>
      </main>
      <Footer />
    </>
  );
}
