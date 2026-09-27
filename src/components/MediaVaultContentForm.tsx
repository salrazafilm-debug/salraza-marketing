"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { VAULT_INTRO_TEXT_KEY } from "@/lib/site-content";

/**
 * The editable text on the Media Vault login page: the supporting paragraph
 * under the headline. Same single-form, single-save-button pattern as
 * ClientSettingsForm.
 */
export function MediaVaultContentForm({ introText }: { introText: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | undefined>();
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(undefined);
    setSaved(false);

    const formData = new FormData(event.currentTarget);
    const fields = { [VAULT_INTRO_TEXT_KEY]: String(formData.get(VAULT_INTRO_TEXT_KEY) ?? "") };

    const res = await fetch("/api/admin/site-content", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields }),
    });
    const data = await res.json();

    setSubmitting(false);
    if (!res.ok) {
      setError(data.error || "Could not save changes.");
      return;
    }

    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl border border-line bg-paper p-4">
      <label className="flex flex-col gap-2">
        <span className="text-label text-ink">Supporting text (under the headline)</span>
        <textarea
          name={VAULT_INTRO_TEXT_KEY}
          defaultValue={introText}
          rows={3}
          className="focus-brand rounded border border-line bg-paper-raised px-4 py-3 text-body text-ink"
        />
      </label>

      {error && <p className="text-caption text-red-700">{error}</p>}
      {saved && <p className="text-caption text-purple-text">Saved.</p>}

      <button
        type="submit"
        disabled={submitting}
        className="focus-brand inline-flex w-fit items-center justify-center rounded-full bg-highlighter px-6 py-3 text-label text-on-highlighter transition hover:brightness-95 disabled:opacity-60"
      >
        {submitting ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
