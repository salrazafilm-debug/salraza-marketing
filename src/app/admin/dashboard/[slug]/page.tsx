import { createHash } from "node:crypto";
import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/admin-session";
import { findClientBySlug, listClientPasswords, listMediaVariantsByClient } from "@/lib/clients";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { AdminLogoutButton } from "@/components/AdminLogoutButton";
import { ClientSettingsForm } from "@/components/ClientSettingsForm";
import { ClientPasswordsManager } from "@/components/ClientPasswordsManager";
import { AdminVault, INDIVIDUAL } from "@/components/admin/AdminVault";
import { ClientPreview } from "@/components/admin/ClientPreview";

export const metadata: Metadata = {
  title: "Admin — Salraza Marketing",
  robots: { index: false, follow: false },
};

const TABS = [
  { id: "folders", label: "Folders & uploads" },
  { id: "preview", label: "Client view & customize" },
  { id: "access", label: "Passwords" },
] as const;
type Tab = (typeof TABS)[number]["id"];

export default async function AdminClientPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string; folder?: string }>;
}) {
  const cookieStore = await cookies();
  if (!verifyAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)) {
    redirect("/admin");
  }

  const { slug } = await params;
  const { tab: tabParam, folder } = await searchParams;
  const tab: Tab = TABS.some((t) => t.id === tabParam) ? (tabParam as Tab) : "folders";

  const client = await findClientBySlug(slug);
  if (!client) notFound();
  const [extraPasswords, variantsByItem] = await Promise.all([
    listClientPasswords(client.slug),
    listMediaVariantsByClient(client.slug),
  ]);

  const previewFolder = folder && folder !== INDIVIDUAL && client.folders.some((f) => f.id === folder) ? folder : null;
  const previewSrc = `/clients/${client.slug}/vault${previewFolder ? `?folder=${previewFolder}` : ""}`;
  // Changes whenever anything the client sees changes, so the preview reloads itself after a save.
  const previewVersion = createHash("sha1")
    .update(
      JSON.stringify([
        client.name,
        client.welcomeNote,
        client.folders,
        client.media.map((item) => [item.id, item.label, item.caption, item.folderId, item.thumbnailUrl]),
      ])
    )
    .digest("hex");

  return (
    <>
      <SiteHeader revealImmediately />
      <main className="min-h-[100svh] px-4 pt-28 pb-20 sm:px-6">
        <div className="mx-auto max-w-[1200px]">
          <div className="flex flex-col gap-4 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Link href="/admin/dashboard" className="focus-brand text-caption text-purple-text underline">
                ← All families
              </Link>
              <h1 className="text-headline mt-2 text-ink">{client.name}</h1>
              <p className="text-caption text-ink-muted">
                {client.folders.length} folder{client.folders.length === 1 ? "" : "s"} · {client.media.length} item
                {client.media.length === 1 ? "" : "s"}
              </p>
            </div>
            <AdminLogoutButton />
          </div>

          <nav className="sticky top-20 z-20 -mx-4 mb-8 overflow-x-auto border-b border-line bg-paper/95 px-4 backdrop-blur sm:mx-0 sm:px-0">
            <div className="flex gap-1">
              {TABS.map((t) => (
                <Link
                  key={t.id}
                  href={`?tab=${t.id}`}
                  aria-current={tab === t.id ? "page" : undefined}
                  className={`focus-brand whitespace-nowrap border-b-2 px-4 py-3 text-label transition ${
                    tab === t.id ? "border-ink text-ink" : "border-transparent text-ink-muted hover:text-ink"
                  }`}
                >
                  {t.label}
                </Link>
              ))}
            </div>
          </nav>

          {tab === "folders" && (
            <AdminVault
              clientSlug={client.slug}
              folders={client.folders}
              items={client.media}
              variantsByItem={variantsByItem}
              selected={folder ?? null}
            />
          )}

          {tab === "preview" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-subhead text-ink">What your client sees</p>
                  <p className="text-caption text-ink-muted">
                    This is their real vault page. Tap around in it — open folders, play videos.
                  </p>
                </div>
                <ClientPreview src={previewSrc} version={previewVersion} />
              </div>
              <div className="flex flex-col gap-6">
                <ClientSettingsForm slug={client.slug} name={client.name} welcomeNote={client.welcomeNote} />
                <div className="rounded-xl bg-paper-raised p-5 text-caption text-ink-muted">
                  <p className="text-label text-ink">Customize folders</p>
                  <p className="mt-1">
                    Folder names, dates, covers and what&apos;s inside them are edited in{" "}
                    <Link href="?tab=folders" className="focus-brand text-purple-text underline">
                      Folders &amp; uploads
                    </Link>
                    . The preview updates after each save.
                  </p>
                </div>
              </div>
            </div>
          )}

          {tab === "access" && (
            <div className="max-w-xl">
              <ClientPasswordsManager clientSlug={client.slug} passwords={extraPasswords} />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
