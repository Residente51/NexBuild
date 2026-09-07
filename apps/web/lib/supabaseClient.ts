import { createClient } from '@supabase/supabase-js';

type PublicSupabaseClient = ReturnType<typeof createClient>;

let publicClient: PublicSupabaseClient | undefined;

/** Lazily create the anonymous catalog client so missing env is recoverable. */
export function getSupabasePublicClient(): PublicSupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are missing');
  }

  publicClient ??= createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: typeof window !== "undefined",
      persistSession: typeof window !== "undefined",
    },
  });

  return publicClient;
}
