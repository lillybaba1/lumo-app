import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Try to get from environment variables, with fallbacks
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ||
                      'https://edsuvnlbviosnyxbjptx.supabase.co'

  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
                          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkc3V2bmxidmlvc255eGJqcHR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NzYxMDAsImV4cCI6MjA3ODI1MjEwMH0.DC30J6n1w5zFp1H4fmSaAGbcD2R9g6RdfD_aM3907jM'

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      '@supabase/ssr: Your project\'s URL and API key are required to create a Supabase client!\n\n' +
      'Check your Supabase project\'s API settings to find these values\n' +
      'https://supabase.com/dashboard/project/_/settings/api\n\n' +
      'Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your .env.local file'
    )
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
