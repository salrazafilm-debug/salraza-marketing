"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function ClientLoginForm({ initialError }: { initialError?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | undefined>(initialError);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
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
        setError(data.error || "That password didn't match a workspace.");
        setSubmitting(false);
        return;
      }

      router.push(`/clients/${data.slug}/workspace`);
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-sm flex-col gap-4">
      <label className="flex flex-col gap-2">
        <span className="text-label text-ink">Workspace password</span>
        <input
          required
          autoFocus
          type="password"
          name="password"
          autoComplete="current-password"
          className="focus-brand rounded border border-line bg-paper px-4 py-3 text-body text-ink"
        />
      </label>

      {error && <p className="text-caption text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="focus-brand inline-flex items-center justify-center rounded-full bg-highlighter px-6 py-3 text-label text-on-highlighter transition hover:brightness-95 disabled:opacity-60"
      >
        {submitting ? "Checking…" : "Enter your workspace"}
      </button>
    </form>
  );
}
