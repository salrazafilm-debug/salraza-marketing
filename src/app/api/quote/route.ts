import { NextResponse } from "next/server";

const TO_EMAIL = process.env.QUOTE_TO_EMAIL || "salraza.film@gmail.com";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Salraza Marketing <onboarding@resend.dev>";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const business = String(body.business ?? "").trim();
  const service = String(body.service ?? "").trim();
  const message = String(body.message ?? "").trim();

  if (!name || !email) {
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  const submission = { name, email, business, service, message, receivedAt: new Date().toISOString() };

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    // No email provider configured yet — log so the request isn't silently lost.
    console.log("[quote request] RESEND_API_KEY not set, logging instead of emailing:", submission);
    return NextResponse.json({ ok: true, delivered: false });
  }

  const html = `
    <h2>New quote request — Salraza Marketing</h2>
    <p><strong>Name:</strong> ${escapeHtml(name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    ${business ? `<p><strong>Business:</strong> ${escapeHtml(business)}</p>` : ""}
    ${service ? `<p><strong>Interested in:</strong> ${escapeHtml(service)}</p>` : ""}
    ${message ? `<p><strong>Message:</strong><br/>${escapeHtml(message).replace(/\n/g, "<br/>")}</p>` : ""}
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: TO_EMAIL,
        reply_to: email,
        subject: `New quote request from ${name}`,
        html,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[quote request] Resend API error:", res.status, errText);
      return NextResponse.json({ error: "Failed to send email" }, { status: 502 });
    }

    return NextResponse.json({ ok: true, delivered: true });
  } catch (err) {
    console.error("[quote request] Failed to send email:", err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 502 });
  }
}
