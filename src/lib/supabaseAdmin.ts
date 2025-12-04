import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseAdminInstance: SupabaseClient | null = null;

// Lazy initialization to avoid build-time errors
function getSupabaseAdmin(): SupabaseClient {
  if (supabaseAdminInstance) {
    return supabaseAdminInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ||
                      'https://edsuvnlbviosnyxbjptx.supabase.co';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
                         'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkc3V2bmxidmlvc255eGJqcHR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjY3NjEwMCwiZXhwIjoyMDc4MjUyMTAwfQ.lz5_bbcNNsUmDFdaorlFZi0XPHvnSt3Zqd-Yd_txRHw';

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
