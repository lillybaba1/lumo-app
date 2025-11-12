import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabaseAdmin: SupabaseClient | undefined

function initSupabaseAdmin(): SupabaseClient {
  if (_supabaseAdmin) {
    return _supabaseAdmin
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    // During build time, env vars may not be set. This is expected.
    // At runtime in production, this error will be thrown when Supabase is actually used.
    console.warn('Supabase environment variables not configured. Database features will use fallback data.')
    throw new Error('Missing Supabase environment variables')
  }

  _supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  return _supabaseAdmin
}

// Export a Proxy that lazily initializes on first access
// This allows the module to be imported during build without throwing errors
// When properly configured with env vars, Supabase will work normally
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = initSupabaseAdmin()
    const value = client[prop as keyof SupabaseClient]
    return typeof value === 'function' ? value.bind(client) : value
  }
})
