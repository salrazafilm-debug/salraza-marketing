"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { MARKSMEN_SLUG } from "@/lib/clientConstants";

type Status = "idle" | "loading" | "entering";

export function ClientLoginForm({ initialError }: { initialError?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | undefined>(initialError);
  const [status, setStatus] = useState<Status>("idle");
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setError(undefined);

    const password = new FormData(event.currentTarget).get("password");

    try {
      const res = await fetch("/api/clients/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "That password didn't match a Media Vault.");
        setStatus("idle");
        return;
      }

      setStatus("entering");
      const introParam = data.slug === MARKSMEN_SLUG ? "?intro=1" : "";
      router.push(`/clients/${data.slug}/vault${introParam}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setStatus("idle");
    }
  }

  const buttonLabel =
    status === "loading" ? "Loading Media…" : status === "entering" ? "Entering vault…" : "Enter vault";

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
      <label className="flex flex-col gap-2">
        <span className="text-xs font-bold uppercase tracking-[0.15em] text-ink/70">Password</span>
        <div className="relative">
          <input
            required
            autoFocus
            type={showPassword ? "text" : "password"}
            name="password"
            autoComplete="current-password"
            placeholder="Your vault password"
            className="focus-brand w-full rounded-xl border border-black/15 bg-white px-5 py-4 pr-14 text-base text-[#1a0f10] placeholder:text-[#1a0f10]/35 shadow-inner"
          />
          <button
            type="button"
            onClick={() => setShowPassword((show) => !show)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="focus-brand absolute inset-y-0 right-0 flex w-12 items-center justify-center text-ink-muted hover:text-ink"
          >
            {showPassword ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6Z" />
                <circle cx="10" cy="10" r="2.5" />
                <path d="M3 3l14 14" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6Z" />
                <circle cx="10" cy="10" r="2.5" />
              </svg>
            )}
          </button>
        </div>
      </label>

      {error && <p className="text-caption text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={status !== "idle"}
        className="focus-brand inline-flex items-center justify-center gap-2 rounded-full bg-[#160b0d] px-10 py-4 text-sm font-bold uppercase tracking-[0.15em] text-white transition hover:-translate-y-0.5 hover:bg-[#8e1b3a] disabled:opacity-60 disabled:hover:translate-y-0"
      >
        {buttonLabel}
        {status === "idle" && (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 10h12M11 5l5 5-5 5" />
          </svg>
        )}
      </button>
    </form>
  );
}
