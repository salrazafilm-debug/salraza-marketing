import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import { findClientBySlug } from "@/lib/clients";
import { getVideoThumbnailUrl } from "@/lib/cloudinary";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { LogoutButton } from "@/components/LogoutButton";

export default async function VaultPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const client = await findClientBySlug(slug);
  if (!client) notFound();

  const cookieStore = await cookies();
  const sessionSlug = verifySession(cookieStore.get(SESSION_COOKIE)?.value);
  if (sessionSlug !== slug) {
    redirect("/clients?error=session");
  }

  return (
    <>
      <SiteHeader revealImmediately />
      <main className="min-h-[100svh] px-4 pt-28 pb-20 sm:px-6">
        <div className="mx-auto max-w-[1200px]">
          <div className="flex flex-col gap-4 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-caption uppercase tracking-wide text-warm-text">
                {client.name}
              </p>
              <h1 className="text-headline mt-2 text-ink">{client.welcomeNote}</h1>
            </div>
            <LogoutButton />
          </div>

          {client.media.length === 0 ? (
            <div className="mt-10 flex flex-col items-center gap-2 rounded-xl bg-cream px-6 py-14 text-center">
              <p className="text-subhead text-ink">Nothing here yet</p>
              <p className="max-w-sm text-body text-ink-muted">
                We&apos;re still finishing your gallery — check back soon.
              </p>
            </div>
          ) : (
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {client.media.map((item) =>
                item.type === "video" ? (
                  <div
                    key={item.id}
                    className="flex flex-col overflow-hidden rounded-xl bg-espresso"
                  >
                    <video
                      controls
                      preload="none"
                      poster={getVideoThumbnailUrl(item.cloudinaryPublicId)}
                      className="aspect-[4/5] w-full bg-black object-contain"
                    >
                      <source src={item.src} />
                    </video>
                    <div className="p-4 sm:p-6">
                      <p className="text-subhead text-paper">{item.label}</p>
                      {item.caption && (
                        <p className="text-caption mt-1 text-golden-hour/80">{item.caption}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div
                    key={item.id}
                    className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-xl"
                  >
                    <Image
                      src={item.src}
                      alt={item.label}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-espresso/90 via-espresso/10 to-transparent" />
                    <div className="relative p-4 sm:p-6">
                      <p className="text-subhead text-paper">{item.label}</p>
                      {item.caption && (
                        <p className="text-caption mt-1 text-golden-hour/80">{item.caption}</p>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          <p className="mt-10 text-caption">
            Don&apos;t see something you were expecting? Email us at{" "}
            <a href="mailto:salraza.film@gmail.com" className="focus-brand text-purple-text underline">
              salraza.film@gmail.com
            </a>{" "}
            and we&apos;ll get it added.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
