import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

const dbEnvSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional()
});

export type DatabaseRole = "anon" | "service";

let anonClient: SupabaseClient | null = null;
let serviceClient: SupabaseClient | null = null;

export function getSupabaseClient(role: DatabaseRole = "anon"): SupabaseClient {
  const env = dbEnvSchema.parse(process.env);

  if (role === "service") {
    if (!env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for service Supabase client");
    }

    serviceClient ??= createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false }
    });
    return serviceClient;
  }

  anonClient ??= createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false }
  });
  return anonClient;
}
