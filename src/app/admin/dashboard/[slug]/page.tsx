import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/admin-session";
import { findClientBySlug } from "@/lib/clients";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { AdminLogoutButton } from "@/components/AdminLogoutButton";
import { MediaUploader } from "@/components/MediaUploader";
import { MediaManager } from "@/components/MediaManager";
import { ClientSettingsForm } from "@/components/ClientSettingsForm";

export const metadata: Metadata = {
  title: "Admin — Salraza Marketing",
  robots: { index: false, follow: false },
};

export default async function AdminClientPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const cookieStore = await cookies();
  if (!verifyAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)) {
    redirect("/admin");
  }

  const { slug } = await params;
  const client = await findClientBySlug(slug);
  if (!client) notFound();

  return (
    <>
      <SiteHeader revealImmediately />
      <main className="min-h-[100svh] px-4 pt-28 pb-20 sm:px-6">
        <div className="mx-auto max-w-[1200px]">
          <div className="flex flex-col gap-4 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Link href="/admin/dashboard" className="focus-brand text-caption text-purple-text underline">
                ← All clients
              </Link>
              <h1 className="text-headline mt-2 text-ink">{client.name}</h1>
              <p className="text-caption text-ink-muted">/clients/{client.slug}/vault</p>
            </div>
            <AdminLogoutButton />
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
            <div className="flex flex-col gap-8">
              <MediaUploader clientSlug={client.slug} />
              <MediaManager items={client.media} />
            </div>

            <ClientSettingsForm slug={client.slug} name={client.name} welcomeNote={client.welcomeNote} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
