"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type PasswordEntry = { id: string; createdAt: string };

/** Manages extra passwords that unlock the same vault as a client's primary password. */
export function ClientPasswordsManager({
  clientSlug,
  passwords,
}: {
  clientSlug: string;
  passwords: PasswordEntry[];
}) {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(undefined);

    const res = await fetch(`/api/admin/clients/${clientSlug}/passwords`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: newPassword }),
    });
    const data = await res.json();

    setSubmitting(false);
    if (!res.ok) {
      setError(data.error || "Could not add password.");
      return;
    }

    setNewPassword("");
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this password? It will stop unlocking this vault.")) return;
    setBusyId(id);
    await fetch(`/api/admin/client-passwords/${id}`, { method: "DELETE" });
    setBusyId(null);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-paper-raised p-6">
      <div>
        <p className="text-subhead text-ink">Extra passwords</p>
        <p className="text-caption mt-1 text-warm-text">
          Additional passwords that unlock this same vault, alongside the main password above.
        </p>
      </div>

      {passwords.length === 0 ? (
        <p className="text-caption text-ink-muted">No extra passwords yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {passwords.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center justify-between rounded border border-line bg-paper px-3 py-2"
            >
              <span className="text-caption text-ink-muted">
                Added {new Date(entry.createdAt).toLocaleDateString()}
              </span>
              <button
                type="button"
                onClick={() => handleDelete(entry.id)}
                disabled={busyId === entry.id}
                className="focus-brand text-label text-red-700 underline disabled:opacity-60"
              >
                {busyId === entry.id ? "Removing…" : "Remove"}
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-2">
          <span className="text-label text-ink">Add a password</span>
          <input
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            minLength={6}
            required
            className="focus-brand rounded border border-line bg-paper px-4 py-3 text-body text-ink"
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="focus-brand rounded-full bg-highlighter px-6 py-3 text-label text-on-highlighter transition hover:brightness-95 disabled:opacity-60"
        >
          {submitting ? "Adding…" : "Add"}
        </button>
      </form>

      {error && <p className="text-caption text-red-700">{error}</p>}
    </div>
  );
}
