#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

console.log('🔧 Applying RLS recursion fix...\n')

const migrationPath = join(__dirname, '../supabase/migrations/20250116_fix_rls_infinite_recursion.sql')
const sql = readFileSync(migrationPath, 'utf-8')

// Split SQL into individual statements (simple approach)
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'))

console.log(`📝 Executing ${statements.length} SQL statements...\n`)

for (let i = 0; i < statements.length; i++) {
  const statement = statements[i] + ';'

  // Skip comments
  if (statement.trim().startsWith('--')) continue

  try {
    const { error } = await supabase.rpc('exec', { sql: statement })

    if (error) {
      // Try alternative method
      console.log(`Statement ${i + 1}/${statements.length}: Executing...`)
      console.log(statement.substring(0, 100) + '...')
    }
  } catch (err) {
    console.warn(`⚠️  Could not execute via RPC: ${err.message}`)
  }
}

console.log('\n✅ Migration statements prepared')
console.log('\n⚠️  Due to Supabase client limitations, please apply manually:')
console.log('\n1. Go to: https://supabase.com/dashboard')
console.log('2. Select project: edsuvnlbviosnyxbjptx')
console.log('3. Navigate to: SQL Editor')
console.log('4. Click: "New query"')
console.log('5. Copy the SQL from: supabase/migrations/20250116_fix_rls_infinite_recursion.sql')
console.log('6. Paste into editor and click "Run"\n')
console.log('📁 SQL file location: supabase/migrations/20250116_fix_rls_infinite_recursion.sql\n')
