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

/** Signs a client vault session token for the given client slug. */
export function signSession(slug: string): string {
  const payload = JSON.stringify({ slug, exp: Date.now() + SESSION_TTL_MS });
  const encodedPayload = base64url(payload);
  const signature = createHmac("sha256", getSecret()).update(encodedPayload).digest("base64url");
  return `${encodedPayload}.${signature}`;
}

/** Verifies a session token and returns the client slug if valid and unexpired. */
export function verifySession(token: string | undefined | null): string | null {
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
    return payload.slug;
  } catch {
    return null;
  }
}
