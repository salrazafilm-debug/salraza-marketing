import { createClient } from "@supabase/supabase-js";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} must be set. See .env.example.`);
  return value;
}

/**
 * Server-only Supabase client using the secret key (full table access,
 * bypasses row-level security). Never import this from a "use client"
 * component — it must only run on the server (route handlers, server
 * components, server actions).
 */
export function getSupabaseAdmin() {
  return createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SECRET_KEY"), {
    auth: { persistSession: false },
  });
}
