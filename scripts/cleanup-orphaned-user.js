#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function cleanup() {
  console.log('🔍 Checking for orphaned or duplicate users...\n')

  // Get email/phone from command line args
  const email = process.argv[2]
  const phone = process.argv[3]

  if (!email && !phone) {
    console.log('Usage: node cleanup-orphaned-user.js <email> [phone]')
    console.log('Example: node cleanup-orphaned-user.js user@example.com +12201234567')
    process.exit(1)
  }

  // Check if user exists in users table
  let query = supabase.from('users').select('*')

  if (email) {
    query = query.eq('email', email.toLowerCase())
  }

  const { data: users, error } = await query

  if (error) {
    console.error('❌ Error checking users table:', error.message)
    return
  }

  console.log(`Found ${users?.length || 0} users in users table`)
  if (users && users.length > 0) {
    users.forEach(user => {
      console.log(`  - ID: ${user.id}`)
      console.log(`    Email: ${user.email}`)
      console.log(`    Phone: ${user.phone_number}`)
      console.log(`    Role: ${user.role}`)
    })
  }

  // Check auth users
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers()

  if (authError) {
    console.error('❌ Error listing auth users:', authError.message)
    return
  }

  const matchingAuthUsers = authData.users.filter(u =>
    (email && u.email?.toLowerCase() === email.toLowerCase()) ||
    (phone && u.phone === phone)
  )

  console.log(`\nFound ${matchingAuthUsers.length} matching users in Supabase Auth`)
  if (matchingAuthUsers.length > 0) {
    matchingAuthUsers.forEach(user => {
      console.log(`  - ID: ${user.id}`)
      console.log(`    Email: ${user.email}`)
      console.log(`    Phone: ${user.phone}`)
      console.log(`    Created: ${user.created_at}`)
    })
  }

  // Offer to clean up
  if (matchingAuthUsers.length > 0 || (users && users.length > 0)) {
    console.log('\n⚠️  To clean up these users, you can:')
    console.log('1. Delete from Supabase dashboard: https://supabase.com/dashboard/project/edsuvnlbviosnyxbjptx/auth/users')
    console.log('2. Use SQL in Supabase SQL Editor:')

    if (email) {
      console.log(`\n   -- Delete from users table`)
      console.log(`   DELETE FROM public.users WHERE email = '${email.toLowerCase()}';`)
      console.log(`\n   -- Then delete from Supabase Auth (use the dashboard)`)
    }
  }
}

cleanup().catch(console.error)
