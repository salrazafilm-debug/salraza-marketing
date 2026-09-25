"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function CreateClientForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(undefined);

    const formData = new FormData(event.currentTarget);

    try {
      const res = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          name,
          password: formData.get("password"),
          welcomeNote: formData.get("welcomeNote"),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Could not create family.");
        setSubmitting(false);
        return;
      }

      router.push(`/admin/dashboard/${data.slug}`);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="focus-brand inline-flex items-center justify-center rounded-full bg-highlighter px-6 py-3 text-label text-on-highlighter transition hover:brightness-95"
      >
        + Add a family
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex w-full max-w-md flex-col gap-4 rounded-xl bg-paper-raised p-6 text-left"
    >
      <label className="flex flex-col gap-2">
        <span className="text-label text-ink">Family name</span>
        <input
          required
          autoFocus
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            if (!slugTouched) setSlug(slugify(event.target.value));
          }}
          className="focus-brand rounded border border-line bg-paper px-4 py-3 text-body text-ink"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-label text-ink">Media Vault URL slug</span>
        <input
          required
          value={slug}
          onChange={(event) => {
            setSlugTouched(true);
            setSlug(slugify(event.target.value));
          }}
          className="focus-brand rounded border border-line bg-paper px-4 py-3 font-mono text-body text-ink"
        />
        <span className="text-caption text-ink-muted">/clients/{slug || "…"}/vault</span>
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-label text-ink">Media Vault password</span>
        <input
          required
          minLength={6}
          type="text"
          name="password"
          className="focus-brand rounded border border-line bg-paper px-4 py-3 text-body text-ink"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-label text-ink">Welcome note</span>
        <input
          name="welcomeNote"
          defaultValue="Welcome to your Media Vault."
          className="focus-brand rounded border border-line bg-paper px-4 py-3 text-body text-ink"
        />
      </label>

      {error && <p className="text-caption text-red-700">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="focus-brand inline-flex items-center justify-center rounded-full bg-highlighter px-6 py-3 text-label text-on-highlighter transition hover:brightness-95 disabled:opacity-60"
        >
          {submitting ? "Creating…" : "Create family"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="focus-brand text-label text-ink-muted underline hover:text-ink"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
