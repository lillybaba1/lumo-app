import { createClient } from '@supabase/supabase-js'

// Use a function to get the client, which allows for lazy evaluation
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ||
                      'https://edsuvnlbviosnyxbjptx.supabase.co'

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
                         'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkc3V2bmxidmlvc255eGJqcHR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjY3NjEwMCwiZXhwIjoyMDc4MjUyMTAwfQ.lz5_bbcNNsUmDFdaorlFZi0XPHvnSt3Zqd-Yd_txRHw'

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Export a single instance
export const supabaseAdmin = getSupabaseAdmin()
