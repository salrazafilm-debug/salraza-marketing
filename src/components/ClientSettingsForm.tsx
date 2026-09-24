"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function ClientSettingsForm({
  slug,
  name,
  welcomeNote,
}: {
  slug: string;
  name: string;
  welcomeNote: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | undefined>();
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(undefined);
    setSaved(false);

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");

    const res = await fetch(`/api/admin/clients/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        welcomeNote: formData.get("welcomeNote"),
        ...(password ? { password } : {}),
      }),
    });
    const data = await res.json();

    setSubmitting(false);
    if (!res.ok) {
      setError(data.error || "Could not save changes.");
      return;
    }

    setSaved(true);
    (event.target as HTMLFormElement).reset();
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm(`Delete ${name}'s entire vault? This cannot be undone.`)) return;
    setDeleting(true);
    await fetch(`/api/admin/clients/${slug}`, { method: "DELETE" });
    router.push("/admin/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl bg-paper-raised p-6">
      <p className="text-subhead text-ink">Vault settings</p>

      <label className="flex flex-col gap-2">
        <span className="text-label text-ink">Family name</span>
        <input
          name="name"
          defaultValue={name}
          required
          className="focus-brand rounded border border-line bg-paper px-4 py-3 text-body text-ink"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-label text-ink">Welcome note</span>
        <input
          name="welcomeNote"
          defaultValue={welcomeNote}
          className="focus-brand rounded border border-line bg-paper px-4 py-3 text-body text-ink"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-label text-ink">New password (leave blank to keep current)</span>
        <input
          name="password"
          type="text"
          minLength={6}
          className="focus-brand rounded border border-line bg-paper px-4 py-3 text-body text-ink"
        />
      </label>

      {error && <p className="text-caption text-red-700">{error}</p>}
      {saved && <p className="text-caption text-purple-text">Saved.</p>}

      <div className="flex items-center justify-between">
        <button
          type="submit"
          disabled={submitting}
          className="focus-brand inline-flex items-center justify-center rounded-full bg-highlighter px-6 py-3 text-label text-on-highlighter transition hover:brightness-95 disabled:opacity-60"
        >
          {submitting ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="focus-brand text-label text-red-700 underline disabled:opacity-60"
        >
          {deleting ? "Deleting…" : "Delete vault"}
        </button>
      </div>
    </form>
  );
}
