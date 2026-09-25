import { NextResponse } from "next/server";
import { findClientSlugByPassword } from "@/lib/clients";
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

  const slug = await findClientSlugByPassword(password);

  if (!slug) {
    return NextResponse.json({ error: "That password didn't match a Media Vault." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true, slug });
  response.cookies.set(SESSION_COOKIE, signSession(slug), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return response;
}
