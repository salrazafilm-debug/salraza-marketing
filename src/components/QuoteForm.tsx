"use client";

import { useState, type FormEvent } from "react";

type Status = "idle" | "submitting" | "success" | "error";

const SERVICES = [
  "Social media management",
  "Photography",
  "Short-form video",
  "Not sure yet — let's talk",
];

export function QuoteForm() {
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");

    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Request failed");
      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-xl bg-paper-raised p-8 text-center sm:p-10">
        <p className="text-headline text-ink">we got it</p>
        <p className="mt-3 text-body text-ink-muted">
          Thank you for reaching out — we&apos;re already excited. We&apos;ll be in touch soon to
          start building together.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5 rounded-xl bg-paper-raised p-6 sm:p-10">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-label text-ink">Your name</span>
          <input
            required
            name="name"
            type="text"
            autoComplete="name"
            className="focus-brand rounded border border-line bg-paper px-4 py-3 text-body text-ink"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-label text-ink">Email</span>
          <input
            required
            name="email"
            type="email"
            autoComplete="email"
            className="focus-brand rounded border border-line bg-paper px-4 py-3 text-body text-ink"
          />
        </label>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-label text-ink">Business or brand name</span>
        <input
          name="business"
          type="text"
          className="focus-brand rounded border border-line bg-paper px-4 py-3 text-body text-ink"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-label text-ink">What are we building together?</span>
        <select
          name="service"
          defaultValue={SERVICES[0]}
          className="focus-brand rounded border border-line bg-paper px-4 py-3 text-body text-ink"
        >
          {SERVICES.map((service) => (
            <option key={service} value={service}>
              {service}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-label text-ink">Tell us where you want to go</span>
        <textarea
          name="message"
          rows={4}
          className="focus-brand rounded border border-line bg-paper px-4 py-3 text-body text-ink"
          placeholder="Picture the win. We'll figure out how to get you there."
        />
      </label>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="submit"
          disabled={status === "submitting"}
          className="focus-brand inline-flex items-center justify-center rounded-full bg-highlighter px-6 py-3 font-display text-sm font-extrabold tracking-wide text-on-highlighter transition hover:brightness-95 disabled:opacity-60"
        >
          {status === "submitting" ? "Sending…" : "Start"}
        </button>
        <p className="text-caption">
          Prefer email?{" "}
          <a href="mailto:salraza.film@gmail.com" className="focus-brand text-purple-text underline">
            salraza.film@gmail.com
          </a>
        </p>
      </div>

      {status === "error" && (
        <p className="text-caption text-red-700">
          Something didn&apos;t send. Please try again, or email us directly.
        </p>
      )}
    </form>
  );
}
