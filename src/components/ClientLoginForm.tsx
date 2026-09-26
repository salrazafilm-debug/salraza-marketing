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
    status === "loading"
      ? "Loading Media…"
      : status === "entering"
        ? "Entering vault…"
        : "Enter your Media Vault";

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-sm flex-col gap-4">
      <label className="flex flex-col gap-2">
        <span className="text-label text-ink">Media Vault password</span>
        <div className="relative">
          <input
            required
            autoFocus
            type={showPassword ? "text" : "password"}
            name="password"
            autoComplete="current-password"
            className="focus-brand w-full rounded border border-line bg-paper px-4 py-3 pr-12 text-body text-ink"
          />
          <button
            type="button"
            onClick={() => setShowPassword((show) => !show)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="focus-brand absolute inset-y-0 right-0 flex w-11 items-center justify-center text-ink-muted hover:text-ink"
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
        className="focus-brand inline-flex items-center justify-center rounded-full bg-highlighter px-6 py-3 text-label text-on-highlighter transition hover:brightness-95 disabled:opacity-60"
      >
        {buttonLabel}
      </button>
    </form>
  );
}
