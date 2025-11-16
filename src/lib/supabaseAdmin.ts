import { createClient } from '@supabase/supabase-js'

// Use a function to get the client, which allows for lazy evaluation
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    // During build time, this might be called for static analysis
    // Return a dummy client that will fail at runtime if actually used
    const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || process.env.NEXT_PHASE === 'phase-development-build'

    if (typeof window === 'undefined' && !isBuildTime) {
      console.error('CRITICAL: Supabase admin client environment variables not set!')
      console.error('Missing:', {
        NEXT_PUBLIC_SUPABASE_URL: !supabaseUrl ? 'MISSING' : 'OK',
        SUPABASE_SERVICE_ROLE_KEY: !serviceRoleKey ? 'MISSING' : 'OK'
      })
    } else if (!isBuildTime) {
      console.warn('Supabase admin client: Environment variables not set (build time)')
    }

    // Create client with placeholder values - will fail if actually used at runtime
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
