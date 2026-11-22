import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "salraza_client_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET must be set in production. See .env.example.");
    }
    return "dev-only-insecure-secret-set-SESSION_SECRET-in-.env";
  }
  return secret;
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

/** Signs a client vault session token. A "guest" token can only see folder covers. */
export function signSession(slug: string, access: "full" | "guest" = "full", gid?: string): string {
  const payload = JSON.stringify({ slug, exp: Date.now() + SESSION_TTL_MS, ...(access === "guest" ? { access, gid } : {}) });
  const encodedPayload = base64url(payload);
  const signature = createHmac("sha256", getSecret()).update(encodedPayload).digest("base64url");
  return `${encodedPayload}.${signature}`;
}

/**
 * Verifies a session token and returns what it grants: the client slug and
 * whether it is a full or guest (covers only) session. Null if invalid or expired.
 */
export function verifySessionAccess(token: string | undefined | null): { slug: string; access: "full" | "guest"; gid?: string } | null {
  if (!token) return null;
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = createHmac("sha256", getSecret())
    .update(encodedPayload)
    .digest("base64url");

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (sigBuffer.length !== expectedBuffer.length || !timingSafeEqual(sigBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
    if (typeof payload.slug !== "string" || typeof payload.exp !== "number") return null;
    if (Date.now() > payload.exp) return null;
    return {
      slug: payload.slug,
      access: payload.access === "guest" ? "guest" : "full",
      gid: typeof payload.gid === "string" ? payload.gid : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Returns the client slug only for FULL sessions. Guest sessions return null
 * here on purpose, so every place that serves real files (downloads, the admin
 * check) refuses guests by default; only code that opts in with
 * verifySessionAccess() can let a guest see covers.
 */
export function verifySession(token: string | undefined | null): string | null {
  const s = verifySessionAccess(token);
  return s && s.access === "full" ? s.slug : null;
}
