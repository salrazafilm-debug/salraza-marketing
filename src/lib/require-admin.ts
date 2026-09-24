import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/admin-session";

/** Returns a 401 response if there's no valid admin session, or null if the caller may proceed. */
export async function requireAdmin(): Promise<NextResponse | null> {
  const cookieStore = await cookies();
  const valid = verifyAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  if (!valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
