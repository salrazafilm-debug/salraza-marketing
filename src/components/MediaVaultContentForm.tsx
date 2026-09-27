"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { VAULT_INTRO_TEXT_KEY, VAULT_PHOTO_SLOTS } from "@/lib/site-content";

/**
 * The editable text on the Media Vault login page: a short handwritten
 * caption under each Polaroid, and the supporting paragraph under the
 * headline. Same single-form, single-save-button pattern as
 * ClientSettingsForm — everything saves together with one "Save changes".
 */
export function MediaVaultContentForm({
  captions,
  introText,
}: {
  captions: Record<string, string>;
  introText: string;
}) {
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
    const fields: Record<string, string> = {};
    for (const slot of VAULT_PHOTO_SLOTS) {
      fields[slot.captionKey] = String(formData.get(slot.captionKey) ?? "");
    }
    fields[VAULT_INTRO_TEXT_KEY] = String(formData.get(VAULT_INTRO_TEXT_KEY) ?? "");

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
      <p className="text-label text-ink">Handwritten notes &amp; supporting text</p>

      {VAULT_PHOTO_SLOTS.map((slot) => (
        <label key={slot.captionKey} className="flex flex-col gap-2">
          <span className="text-label text-ink">{slot.label} — handwritten note</span>
          <input
            name={slot.captionKey}
            defaultValue={captions[slot.captionKey] ?? ""}
            placeholder="e.g. Our favorite family!"
            className="focus-brand rounded border border-line bg-paper-raised px-4 py-3 text-body text-ink"
          />
        </label>
      ))}

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
