import { NextResponse } from "next/server";
import { CLIENTS } from "@/lib/clients";
import { verifyPassword } from "@/lib/password";
import { SESSION_COOKIE, signSession } from "@/lib/session";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const password = String(body.password ?? "");
  if (!password) {
    return NextResponse.json({ error: "Password is required" }, { status: 400 });
  }

  const match = CLIENTS.find((client) => verifyPassword(password, client.passwordHash));

  if (!match) {
    return NextResponse.json({ error: "That password didn't match a workspace." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true, slug: match.slug });
  response.cookies.set(SESSION_COOKIE, signSession(match.slug), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return response;
}
