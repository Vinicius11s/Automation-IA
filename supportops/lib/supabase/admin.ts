import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { assertSupabaseEnv } from "@/lib/supabase/env";

/**
 * Client com SERVICE_ROLE_KEY — uso exclusivo server-side.
 * Nunca importar em componentes client ou expor no bundle.
 */
export function createAdminClient() {
  const { url } = assertSupabaseEnv();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    throw new Error("Missing env var: SUPABASE_SERVICE_ROLE_KEY");
  }

  return createSupabaseClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
