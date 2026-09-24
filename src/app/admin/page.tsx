import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/admin-session";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Admin — Salraza Marketing",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const cookieStore = await cookies();
  if (verifyAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)) {
    redirect("/admin/dashboard");
  }

  return (
    <>
      <SiteHeader revealImmediately />
      <main className="flex min-h-[100svh] flex-col justify-center px-4 pt-28 pb-20 sm:px-6">
        <div className="mx-auto w-full max-w-[1200px] text-center">
          <p className="text-caption uppercase tracking-wide text-warm-text">Admin</p>
          <h1 className="text-headline mt-3 text-ink">Sign in to manage the vault</h1>
          <p className="mx-auto mt-4 max-w-xl text-body text-ink-muted">
            Add clients, assign their passwords, and upload their finished work.
          </p>

          <div className="mt-10">
            <AdminLoginForm />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
