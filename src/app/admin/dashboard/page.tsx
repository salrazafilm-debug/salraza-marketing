import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/admin-session";
import { listClientSummaries } from "@/lib/clients";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { AdminLogoutButton } from "@/components/AdminLogoutButton";
import { CreateClientForm } from "@/components/CreateClientForm";

export const metadata: Metadata = {
  title: "Admin dashboard — Salraza Marketing",
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage() {
  const cookieStore = await cookies();
  if (!verifyAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)) {
    redirect("/admin");
  }

  const clients = await listClientSummaries();

  return (
    <>
      <SiteHeader revealImmediately />
      <main className="min-h-[100svh] px-4 pt-28 pb-20 sm:px-6">
        <div className="mx-auto max-w-[1200px]">
          <div className="flex flex-col gap-4 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-caption uppercase tracking-wide text-warm-text">Admin</p>
              <h1 className="text-headline mt-2 text-ink">The Media Vault</h1>
            </div>
            <AdminLogoutButton />
          </div>

          <div className="mt-8">
            <CreateClientForm />
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clients.map((client) => (
              <Link
                key={client.slug}
                href={`/admin/dashboard/${client.slug}`}
                className="focus-brand flex flex-col gap-2 rounded-xl bg-paper-raised p-6 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <p className="text-subhead text-ink">{client.name}</p>
                <p className="text-caption mt-2 text-warm-text">
                  {client.mediaCount} {client.mediaCount === 1 ? "item" : "items"} uploaded
                </p>
              </Link>
            ))}

            {clients.length === 0 && (
              <p className="text-body text-ink-muted">No families yet — add your first one above.</p>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
