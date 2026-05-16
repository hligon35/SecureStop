import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getConfig } from "@/lib/config";

type AppSupabaseClient = SupabaseClient<any, string, string>;

let cachedClient: AppSupabaseClient | undefined;

export function isSupabaseConfigured(): boolean {
  const supabase = getConfig().supabase;
  return !!supabase?.url && !!supabase?.anonKey;
}

export function getSupabaseClient(): AppSupabaseClient {
  if (cachedClient) return cachedClient;

  const supabase = getConfig().supabase;
  if (!supabase?.url || !supabase?.anonKey) {
    throw new Error(
      "Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  const client = createClient(supabase.url, supabase.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    db: {
      schema: supabase.schema,
    },
  });
  cachedClient = client;
  return client;
}
