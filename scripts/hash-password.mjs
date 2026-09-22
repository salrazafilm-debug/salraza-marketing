// Usage: node scripts/hash-password.mjs "the new client password"
// Paste the printed `salt:hash` string into a client's passwordHash in src/lib/clients.ts.
import { randomBytes, scryptSync } from "node:crypto";

const password = process.argv[2];
if (!password) {
  console.error('Usage: node scripts/hash-password.mjs "the new client password"');
  process.exit(1);
}

const salt = randomBytes(16).toString("hex");
const hash = scryptSync(password, salt, 64).toString("hex");
console.log(`${salt}:${hash}`);
