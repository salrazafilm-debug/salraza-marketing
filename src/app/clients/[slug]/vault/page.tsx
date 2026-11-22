import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { findClientBySlug, type MediaItem } from "@/lib/clients";
import { MARKSMEN_SLUG } from "@/lib/clientConstants";
import { getDownloadUrl, getVideoThumbnailUrl } from "@/lib/cloudinary";
import { SESSION_COOKIE, verifySessionAccess } from "@/lib/session";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/admin-session";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { LogoutButton } from "@/components/LogoutButton";
import { MarksmenVaultIntro } from "@/components/MarksmenVaultIntro";
import { RevealSection } from "@/components/RevealSection";
import { VaultMediaGrid, type VaultMediaItem } from "@/components/VaultMediaGrid";
import { VaultFolderGrid } from "@/components/VaultFolderGrid";
import { LockedFolderGrid, type LockedFolder } from "@/components/LockedFolderGrid";
import { formatEventDate, getFolderCoverSrc } from "@/lib/vault-folder-utils";
import { SectionFrame } from "@/components/site/HomeSections";
import { getVaultLook } from "@/lib/vault-look";
import { resolveIntroVideo } from "@/lib/intro-video";
import type { Section } from "@/components/site/layout-types";

function withUrls(items: MediaItem[]): VaultMediaItem[] {
  return items.map((item) => ({
    ...item,
    downloadUrl: getDownloadUrl(item.src, item.label),
    posterUrl: item.type === "video" ? getVideoThumbnailUrl(item.cloudinaryPublicId) : undefined,
  }));
}

export default async function VaultPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ intro?: string; folder?: string }>;
}) {
  const { slug } = await params;
  const { intro, folder: folderParam } = await searchParams;
  const client = await findClientBySlug(slug);
  if (!client) notFound();

  const cookieStore = await cookies();
  const session = verifySessionAccess(cookieStore.get(SESSION_COOKIE)?.value);
  const sessionSlug = session?.slug;
  // The admin can open any vault too — that's what powers the "Client view" preview.
  const isAdmin = verifyAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  if (sessionSlug !== slug && !isAdmin) {
    redirect("/clients?error=session");
  }
  // A guest (covers-only password) sees locked folder covers and nothing else.
  const isGuest = !isAdmin && session?.access === "guest";
  if (isGuest && folderParam) redirect(`/clients/${slug}/vault`);

  const activeFolder = folderParam ? client.folders.find((folder) => folder.id === folderParam) : undefined;
  const lockedFolders: LockedFolder[] = isGuest
    ? client.folders
        .map((folder) => ({ folder, items: client.media.filter((item) => item.folderId === folder.id) }))
        .filter(({ items }) => items.length > 0)
        .map(({ folder, items }) => ({
          id: folder.id,
          name: folder.name,
          dateLabel: folder.eventDate ? formatEventDate(folder.eventDate) : null,
          cover: getFolderCoverSrc(folder, items),
        }))
    : [];
  const showIntro = slug === MARKSMEN_SLUG && intro === "1";
  const isMarksmen = slug === MARKSMEN_SLUG;
  // The look chosen in Admin → "Client view & customize" (Marksmen keeps its own theme).
  const look = isMarksmen ? {} : await getVaultLook(slug);
  const lookFrame: Section = {
    id: "vault",
    type: "textBlock",
    text: {},
    style: { bg: look.bg, color1: look.color1, color2: look.color2, angle: look.angle, grain: look.grain, hover: look.hover },
  };
  let step = 0;

  return (
    <>
      <SiteHeader revealImmediately theme={isMarksmen ? "marksmen" : "default"} />
      <SectionFrame s={lookFrame}>
      <main
        data-theme={isMarksmen ? "marksmen" : undefined}
        className={`min-h-[100svh] px-4 pb-20 sm:px-6 ${isMarksmen ? "pt-[150px] md:pt-[112px] bg-[#0a0a0c]" : "pt-28"}`}
      >
        <MarksmenVaultIntro introSrc={showIntro ? await resolveIntroVideo() : null}>
          <div className="mx-auto max-w-[1200px]">
            <RevealSection index={step++}>
              <div
                className={`flex flex-col gap-4 ${
                  isMarksmen
                    ? "items-center pb-0 text-center"
                    : "border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between"
                }`}
              >
                <div className={isMarksmen ? "flex flex-col items-center" : ""}>
                  {!isMarksmen && (
                    <p className="text-caption uppercase tracking-wide text-warm-text">
                      {look.eyebrow || client.name}
                    </p>
                  )}
                  <h1 className="text-headline mt-2 text-ink">
                    {isMarksmen ? (
                      <>
                        Welcome
                        <br />
                        DMV Marksmen
                      </>
                    ) : (
                      client.welcomeNote
                    )}
                  </h1>
                  {look.intro && <p className="mt-3 max-w-xl whitespace-pre-line text-body text-ink-muted">{look.intro}</p>}
                </div>
                {!isMarksmen && <LogoutButton />}
              </div>
            </RevealSection>

            {isGuest ? (
              <RevealSection index={step++}>
                <div className="mt-10 flex flex-col gap-6">
                  <div className="mx-auto flex max-w-xl flex-col items-center gap-2 rounded-xl bg-cream px-6 py-5 text-center">
                    <p className="text-subhead text-ink">Guest preview</p>
                    <p className="text-body text-ink-muted">
                      You can see the covers of each folder. The photos and videos inside are private and locked.
                    </p>
                  </div>
                  {lockedFolders.length > 0 ? (
                    <LockedFolderGrid folders={lockedFolders} />
                  ) : (
                    <p className="text-center text-body text-ink-muted">Nothing to preview yet.</p>
                  )}
                </div>
              </RevealSection>
            ) : client.media.length === 0 ? (
              <RevealSection index={step++}>
                <div className="mt-10 flex flex-col items-center gap-2 rounded-xl bg-cream px-6 py-14 text-center">
                  <p className="text-subhead text-ink">Nothing here yet</p>
                  <p className="max-w-sm text-body text-ink-muted">
                    We&apos;re still finishing your gallery — check back soon.
                  </p>
                </div>
              </RevealSection>
            ) : (
              <div className={`flex flex-col gap-10 ${isMarksmen ? "mt-2" : "mt-10"}`}>
                {activeFolder ? (
                  (() => {
                    const folderItems = client.media.filter((item) => item.folderId === activeFolder.id);
                    const isJerseyReveal =
                      isMarksmen && activeFolder.name.trim().toLowerCase() === "jersey day reveal";
                    return (
                      <RevealSection index={step++}>
                        <div className="flex flex-col gap-4">
                          <Link
                            href={`/clients/${slug}/vault`}
                            className="focus-brand w-fit text-label text-purple-text underline"
                          >
                            ← All folders
                          </Link>
                          {isJerseyReveal && (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src="/clients/dmv-marksmen/marksmen-logo.webp"
                              alt="Marksmen Elite logo"
                              className="mx-auto h-28 w-auto sm:h-36"
                            />
                          )}
                          <div>
                            {activeFolder.eventDate && (
                              <p className="text-caption uppercase tracking-wide text-warm-text">
                                {formatEventDate(activeFolder.eventDate)}
                              </p>
                            )}
                            <h2 className="text-headline text-ink">{activeFolder.name}</h2>
                          </div>
                          {(() => {
                            // The folder's chosen video cover gets its own full-width row first.
                            const featured =
                              !activeFolder.coverUrl && folderItems.find((item) => item.id === activeFolder.coverMediaId && item.externalUrl);
                            const rest = featured ? folderItems.filter((item) => item.id !== featured.id) : folderItems;
                            return (
                              <>
                                {featured && (
                                  <VaultMediaGrid items={withUrls([featured])} isMarksmen={isMarksmen} fullWidth />
                                )}
                                {rest.length > 0 && <VaultMediaGrid items={withUrls(rest)} isMarksmen={isMarksmen} />}
                              </>
                            );
                          })()}
                        </div>
                      </RevealSection>
                    );
                  })()
                ) : (
                  <>
                    <RevealSection index={step++}>
                      <VaultFolderGrid slug={slug} folders={client.folders} media={client.media} />
                    </RevealSection>

                    {(() => {
                      const ungrouped = client.media.filter((item) => !item.folderId);
                      if (ungrouped.length === 0) return null;
                      return (
                        <RevealSection index={step++}>
                          <div className="flex flex-col gap-4">
                            {client.folders.length > 0 && (
                              <h2 className="text-subhead text-ink">More</h2>
                            )}
                            <VaultMediaGrid items={withUrls(ungrouped)} isMarksmen={isMarksmen} />
                          </div>
                        </RevealSection>
                      );
                    })()}
                  </>
                )}
              </div>
            )}

            {!isGuest && !activeFolder && client.media.some((item) => item.type === "image") && (
              <RevealSection index={step++}>
                <div className="mt-10 flex justify-center">
                  <a
                    href={`/api/clients/${slug}/download-all`}
                    download
                    className={`focus-brand inline-flex items-center gap-2 rounded-full px-6 py-3 text-label font-bold transition hover:brightness-95 ${
                      isMarksmen ? "bg-[#2fc4de] text-[#04141a]" : "bg-highlighter text-on-highlighter"
                    }`}
                  >
                    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 2.5v9.5M5 8.5l4 4 4-4" />
                      <path d="M2.5 14.5v1a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-1" />
                    </svg>
                    Download all
                  </a>
                </div>
              </RevealSection>
            )}


            {isMarksmen && (
              <RevealSection index={step++}>
                <div className="mt-10 flex justify-center">
                  <LogoutButton />
                </div>
              </RevealSection>
            )}
          </div>
        </MarksmenVaultIntro>
      </main>
      </SectionFrame>
      <Footer />
    </>
  );
}
