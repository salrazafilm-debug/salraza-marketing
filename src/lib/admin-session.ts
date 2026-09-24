import { verifyPassword } from "@/lib/password";
import { signSession, verifySession } from "@/lib/session";

export const ADMIN_SESSION_COOKIE = "salraza_admin_session";

// The session token format is generic (a slug + expiry), so the admin
// session reuses it with this fixed sentinel value in place of a client slug.
const ADMIN_SLUG = "__admin__";

export function signAdminSession(): string {
  return signSession(ADMIN_SLUG);
}

export function verifyAdminSession(token: string | undefined | null): boolean {
  return verifySession(token) === ADMIN_SLUG;
}

/** Checks a plaintext password against ADMIN_PASSWORD_HASH from the environment. */
export function verifyAdminPassword(password: string): boolean {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash) return false;
  return verifyPassword(password, hash);
}
