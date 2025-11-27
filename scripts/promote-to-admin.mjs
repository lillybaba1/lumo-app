#!/usr/bin/env node

/**
 * Script to promote a user to admin role in Supabase
 * Usage: node scripts/promote-to-admin.mjs <email>
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const email = process.argv[2];

if (!email) {
  console.error('❌ Error: Email address is required');
  console.error('Usage: node scripts/promote-to-admin.mjs <email>');
  console.error('Example: node scripts/promote-to-admin.mjs admin@example.com');
  process.exit(1);
}

async function promoteToAdmin() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log(`\n🔍 Looking for user with email: ${email}...`);

  // Find user by email in auth
  const { data: { users }, error: searchError } = await supabase.auth.admin.listUsers();

  if (searchError) {
    console.error('❌ Error searching for user:', searchError.message);
    process.exit(1);
  }

  const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());

  if (!user) {
    console.error(`❌ User not found with email: ${email}`);
    console.error('Make sure the user has signed up first.');
    process.exit(1);
  }

  console.log(`✅ Found user: ${user.email} (ID: ${user.id})`);

  // Check if user exists in users table
  const { data: userData, error: userCheckError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (userCheckError && userCheckError.code !== 'PGRST116') {
    console.error('❌ Error checking user table:', userCheckError.message);
    process.exit(1);
  }

  if (!userData) {
    // User doesn't exist in users table, create it
    console.log('📝 Creating user record in users table...');

    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'Admin',
        role: 'admin',
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('❌ Error creating user record:', insertError.message);
      process.exit(1);
    }

    console.log('✅ User record created with admin role');
  } else {
    // User exists, update role
    console.log(`📝 Current role: ${userData.role || 'customer'}`);
    console.log('🔄 Updating role to admin...');

    const { error: updateError } = await supabase
      .from('users')
      .update({ role: 'admin' })
      .eq('id', user.id);

    if (updateError) {
      console.error('❌ Error updating role:', updateError.message);
      process.exit(1);
    }

    console.log('✅ Role updated to admin');
  }

  console.log('\n🎉 Success! User has been promoted to admin.');
  console.log('You can now log in to /admin/dashboard\n');
}

promoteToAdmin().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
