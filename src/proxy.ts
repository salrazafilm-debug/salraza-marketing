import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

export function proxy(request: NextRequest) {
  const match = request.nextUrl.pathname.match(/^\/clients\/([^/]+)\/vault/);
  if (!match) return NextResponse.next();

  const slug = match[1];
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const sessionSlug = verifySession(token);

  if (sessionSlug !== slug) {
    const loginUrl = new URL("/clients", request.url);
    loginUrl.searchParams.set("error", "session");
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/clients/:slug/vault", "/clients/:slug/vault/:path*"],
};
