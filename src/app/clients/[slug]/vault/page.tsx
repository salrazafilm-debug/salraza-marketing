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
import { VaultMediaGrid, type VaultMediaItem } from "@/components/VaultMediaGrid";

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
  const isMarksmen = slug === MARKSMEN_SLUG;
  let step = 0;

  return (
    <>
      <SiteHeader revealImmediately theme={isMarksmen ? "marksmen" : "default"} />
      <main
        data-theme={isMarksmen ? "marksmen" : undefined}
        className={`min-h-[100svh] px-4 pb-20 sm:px-6 ${isMarksmen ? "pt-[150px] md:pt-[112px] bg-[#0a0a0c]" : "pt-28"}`}
      >
        <MarksmenVaultIntro introSrc={showIntro ? "/clients/dmv-marksmen/login-intro.mp4" : null}>
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
                      {client.name}
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
                </div>
                {!isMarksmen && <LogoutButton />}
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
              <div className={`flex flex-col gap-10 ${isMarksmen ? "mt-2" : "mt-10"}`}>
                {client.folders.map((folder) => {
                  const folderItems = client.media.filter((item) => item.folderId === folder.id);
                  if (folderItems.length === 0) return null;
                  const isJerseyReveal =
                    isMarksmen && folder.name.trim().toLowerCase() === "jersey day reveal";
                  return (
                    <RevealSection key={folder.id} index={step++}>
                      <div className="flex flex-col gap-4">
                        {isJerseyReveal && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src="/clients/dmv-marksmen/marksmen-logo.webp"
                            alt="Marksmen Elite logo"
                            className="mx-auto h-28 w-auto sm:h-36"
                          />
                        )}
                        <h2 className="text-subhead text-ink">{folder.name}</h2>
                        <VaultMediaGrid items={withUrls(folderItems)} isMarksmen={isMarksmen} />
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
                        <VaultMediaGrid items={withUrls(ungrouped)} isMarksmen={isMarksmen} />
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
      <Footer />
    </>
  );
}
