import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * Server-only client for anonymous build persistence.
 *
 * The service-role key never reaches the browser. A fresh client is returned
 * for every operation so authentication state can never leak between requests.
 */
export function createSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase server environment variables are missing");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
