#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials!')
  console.error('Please ensure .env.local has NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

console.log('🔧 Fixing RLS Infinite Recursion...\n')
console.log(`📍 Supabase URL: ${supabaseUrl}\n`)

// Read the migration file
const migrationPath = path.join(__dirname, '../supabase/migrations/20250116_fix_rls_infinite_recursion.sql')
console.log(`📝 Reading migration file: ${migrationPath}`)

const sql = fs.readFileSync(migrationPath, 'utf-8')
console.log(`✅ Migration file loaded (${sql.length} characters)\n`)

console.log('💡 To apply this migration, you have two options:\n')

console.log('Option 1: Manual execution (Recommended)')
console.log('1. Go to https://supabase.com/dashboard')
console.log('2. Select your project')
console.log('3. Navigate to: SQL Editor')
console.log('4. Create a new query')
console.log('5. Copy the SQL from: supabase/migrations/20250116_fix_rls_infinite_recursion.sql')
console.log('6. Paste and click "Run"\n')

console.log('Option 2: Using psql (if you have direct database access)')
console.log('psql "$DATABASE_URL" < supabase/migrations/20250116_fix_rls_infinite_recursion.sql\n')

console.log('📋 The migration will:')
console.log('✓ Create a security definer function to check admin role')
console.log('✓ Drop and recreate all RLS policies')
console.log('✓ Fix the infinite recursion issue\n')

console.log('🎯 After running the migration:')
console.log('1. Test sign-in functionality')
console.log('2. Verify admin access works')
console.log('3. Check that regular users can only see their own data\n')
