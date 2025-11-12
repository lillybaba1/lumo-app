import { createClient } from '@supabase/supabase-js'

// Use a function to get the client, which allows for lazy evaluation
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    // During build time, this might be called for static analysis
    // Return a dummy client that will fail at runtime if actually used
    if (typeof window === 'undefined' && process.env.NODE_ENV !== 'production') {
      console.warn('Supabase admin client: Environment variables not set')
    }
    // Create client with empty strings - will fail if actually used
    return createClient('https://placeholder.supabase.co', 'placeholder', {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Export a single instance
export const supabaseAdmin = getSupabaseAdmin()
