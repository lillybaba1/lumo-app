import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { getEnv } from './env';

let supabaseAdminInstance: SupabaseClient | null = null;

// Lazy initialization to avoid build-time errors
function getSupabaseAdmin(): SupabaseClient {
  if (supabaseAdminInstance) {
    return supabaseAdminInstance;
  }

  const env = getEnv();
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  // SECURITY: Never use hardcoded keys - always require environment variables
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase environment variables. ' +
      'Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.'
    );
  }

  supabaseAdminInstance = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  return supabaseAdminInstance;
}

// Export as a getter to ensure lazy initialization at runtime, not build time
export const supabaseAdmin = {
  get client() {
    return getSupabaseAdmin();
  },
  // Proxy common methods for backward compatibility
  from: (table: string) => getSupabaseAdmin().from(table),
  auth: {
    get admin() {
      return getSupabaseAdmin().auth.admin;
    }
  },
  storage: {
    from: (bucket: string) => getSupabaseAdmin().storage.from(bucket),
  },
  rpc: (fn: string, params?: object) => getSupabaseAdmin().rpc(fn, params),
};
