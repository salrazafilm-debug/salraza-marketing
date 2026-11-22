"use client";

import { useRouter } from "next/navigation";
import { makePassword } from "@/lib/make-password";
import { useRef, useState, type FormEvent } from "react";

type PasswordEntry = { id: string; createdAt: string };
type GuestEntry = PasswordEntry & { folders: string[] };
type FolderOption = { id: string; name: string; count: number };

/** Manages extra passwords that unlock the same vault as a client's primary password. */
export function ClientPasswordsManager({
  clientSlug,
  passwords,
  guestPasswords = [],
  folders = [],
}: {
  clientSlug: string;
  passwords: PasswordEntry[];
  guestPasswords?: GuestEntry[];
  folders?: FolderOption[];
}) {
  // Which folders each guest password may open (saved the moment a box is ticked).
  const [allowed, setAllowed] = useState<Record<string, string[]>>(() => Object.fromEntries(guestPasswords.map((g) => [g.id, g.folders])));
  const allowedRef = useRef(allowed); // always the latest ticks, even between renders
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [guestPw, setGuestPw] = useState("");
  const [guestError, setGuestError] = useState<string | undefined>();
  const [guestBusy, setGuestBusy] = useState(false);
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

  async function addGuest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGuestBusy(true);
    setGuestError(undefined);
    const res = await fetch(`/api/admin/clients/${clientSlug}/guest-passwords`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: guestPw }),
    });
    const data = await res.json();
    setGuestBusy(false);
    if (!res.ok) {
      setGuestError(data.error || "Could not add guest password.");
      return;
    }
    setGuestPw("");
    router.refresh();
  }

  async function saveFolders(id: string, next: string[]) {
    const previous = allowedRef.current[id] ?? [];
    allowedRef.current = { ...allowedRef.current, [id]: next };
    setAllowed((a) => ({ ...a, [id]: next }));
    setSavingId(id);
    setGuestError(undefined);
    const res = await fetch(`/api/admin/clients/${clientSlug}/guest-passwords`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, folders: next }),
    });
    setSavingId(null);
    if (!res.ok) {
      allowedRef.current = { ...allowedRef.current, [id]: previous };
      setAllowed((a) => ({ ...a, [id]: previous }));
      const data = await res.json().catch(() => ({}));
      setGuestError(data.error || "Could not save folder access.");
      return;
    }
    setSavedId(id);
    setTimeout(() => setSavedId((cur) => (cur === id ? null : cur)), 1500);
  }

  async function removeGuest(id: string) {
    if (!confirm("Remove this guest password? It will stop opening the vault.")) return;
    setBusyId(id);
    await fetch(`/api/admin/clients/${clientSlug}/guest-passwords`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setBusyId(null);
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
          <span className="flex gap-2">
            <input
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              minLength={6}
              required
              className="focus-brand flex-1 rounded border border-line bg-paper px-4 py-3 text-body text-ink"
            />
            <button
              type="button"
              onClick={() => setNewPassword(makePassword())}
              className="focus-brand rounded-full border border-line px-4 text-label text-ink hover:bg-paper"
            >
              Generate
            </button>
          </span>
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

      <div className="mt-4 flex flex-col gap-3 border-t border-line pt-5">
        <div>
          <p className="text-subhead text-ink">Guest passwords</p>
          <p className="text-caption text-ink-muted">
            A guest password opens this vault and shows every folder cover. Tick the folders it may open; unticked folders stay locked.
          </p>
        </div>
        {guestPasswords.length === 0 ? (
          <p className="text-caption text-ink-muted">No guest passwords yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {guestPasswords.map((entry) => (
              <li key={entry.id} className="flex flex-col gap-3 rounded border border-line bg-paper px-3 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-caption text-ink-muted">Guest · added {new Date(entry.createdAt).toLocaleDateString()}</span>
                  <button
                    type="button"
                    onClick={() => removeGuest(entry.id)}
                    disabled={busyId === entry.id}
                    className="focus-brand text-label text-red-700 underline disabled:opacity-60"
                  >
                    {busyId === entry.id ? "Removing…" : "Remove"}
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <p className="text-label text-ink">Folders this password can open</p>
                    <span className="text-caption text-ink-muted">
                      {savingId === entry.id ? "Saving…" : savedId === entry.id ? "Saved ✓" : `${(allowed[entry.id] ?? []).length} of ${folders.length} open`}
                    </span>
                  </div>
                  {folders.length === 0 ? (
                    <p className="text-caption text-ink-muted">No folders yet. Add some under Folders &amp; uploads.</p>
                  ) : (
                    <>
                      <ul className="flex flex-col gap-1">
                        {folders.map((folder) => {
                          const on = (allowed[entry.id] ?? []).includes(folder.id);
                          return (
                            <li key={folder.id}>
                              <label className="flex cursor-pointer items-center gap-3 rounded px-2 py-1.5 hover:bg-paper-raised">
                                <input
                                  type="checkbox"
                                  checked={on}
                                  onChange={() => {
                                    const cur = allowedRef.current[entry.id] ?? [];
                                    void saveFolders(entry.id, on ? cur.filter((f) => f !== folder.id) : [...cur, folder.id]);
                                  }}
                                  className="h-4 w-4 accent-[#8e1b3a]"
                                />
                                <span className="flex-1 text-body text-ink">{folder.name}</span>
                                <span className="text-caption text-ink-muted">{on ? "Can enter" : "Locked"}</span>
                              </label>
                            </li>
                          );
                        })}
                      </ul>
                      <div className="flex gap-3 text-caption">
                        <button type="button" onClick={() => void saveFolders(entry.id, folders.map((f) => f.id))} className="focus-brand text-purple-text underline">
                          Allow all
                        </button>
                        <button type="button" onClick={() => void saveFolders(entry.id, [])} className="focus-brand text-purple-text underline">
                          Lock all
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={addGuest} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="flex flex-1 flex-col gap-2">
            <span className="text-label text-ink">Add a guest password</span>
            <span className="flex gap-2">
              <input
                value={guestPw}
                onChange={(event) => setGuestPw(event.target.value)}
                minLength={6}
                required
                className="focus-brand flex-1 rounded border border-line bg-paper px-4 py-3 text-body text-ink"
              />
              <button
                type="button"
                onClick={() => setGuestPw(makePassword())}
                className="focus-brand rounded-full border border-line px-4 text-label text-ink hover:bg-paper"
              >
                Generate
              </button>
            </span>
          </label>
          <button
            type="submit"
            disabled={guestBusy}
            className="focus-brand rounded-full bg-highlighter px-6 py-3 text-label text-on-highlighter transition hover:brightness-95 disabled:opacity-60"
          >
            {guestBusy ? "Adding…" : "Add guest"}
          </button>
        </form>
        {guestError && <p className="text-caption text-red-700">{guestError}</p>}
      </div>
    </div>
  );
}
