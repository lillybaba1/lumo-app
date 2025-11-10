#!/usr/bin/env tsx

/**
 * Admin Role Management Script
 * 
 * Usage:
 *   npx tsx scripts/make-admin.ts promote email@example.com
 *   npx tsx scripts/make-admin.ts revoke email@example.com
 *   npx tsx scripts/make-admin.ts list
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase environment variables');
  console.error('Please ensure these are set in your .env.local file:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function promoteToAdmin(email: string) {
  console.log(`\n🔍 Looking for user: ${email}...`);

  // Find user in user_profiles table
  const { data: user, error: fetchError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('email', email)
    .single();

  if (fetchError || !user) {
    console.error('❌ User not found. Make sure they have registered first.');
    console.log('\n💡 The user needs to sign up at:');
    console.log('   https://lumo-app-heiliges-projects.vercel.app/signup');
    process.exit(1);
  }

  console.log(`✅ Found user: ${user.name || 'Unknown'}`);
  console.log(`   Current role: ${user.role || 'user'}`);

  if (user.role === 'admin') {
    console.log('⚠️  User is already an admin!');
    return;
  }

  // Update role to admin
  const { error: updateError } = await supabase
    .from('user_profiles')
    .update({ 
      role: 'admin',
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id);

  if (updateError) {
    console.error('❌ Failed to promote user:', updateError.message);
    process.exit(1);
  }

  console.log('🎉 Success! User promoted to admin.');
  console.log(`   ${email} is now an administrator.`);
}

async function revokeAdmin(email: string) {
  console.log(`\n🔍 Looking for admin: ${email}...`);

  const { data: user, error: fetchError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('email', email)
    .single();

  if (fetchError || !user) {
    console.error('❌ User not found.');
    process.exit(1);
  }

  console.log(`✅ Found user: ${user.name || 'Unknown'}`);
  console.log(`   Current role: ${user.role || 'user'}`);

  if (user.role !== 'admin') {
    console.log('⚠️  User is not an admin.');
    return;
  }

  // Update role to user
  const { error: updateError } = await supabase
    .from('user_profiles')
    .update({ 
      role: 'user',
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id);

  if (updateError) {
    console.error('❌ Failed to revoke admin access:', updateError.message);
    process.exit(1);
  }

  console.log('✅ Admin access revoked.');
  console.log(`   ${email} is now a regular user.`);
}

async function listAdmins() {
  console.log('\n📋 Fetching all administrators...\n');

  const { data: admins, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('role', 'admin')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Failed to fetch admins:', error.message);
    process.exit(1);
  }

  if (!admins || admins.length === 0) {
    console.log('⚠️  No administrators found.');
    console.log('\n💡 To create an admin, run:');
    console.log('   npx tsx scripts/make-admin.ts promote email@example.com');
    return;
  }

  console.log(`Found ${admins.length} administrator(s):\n`);
  
  admins.forEach((admin, index) => {
    console.log(`${index + 1}. ${admin.name || 'Unnamed'}`);
    console.log(`   📧 ${admin.email}`);
    console.log(`   🆔 ${admin.id}`);
    console.log(`   📅 Created: ${new Date(admin.created_at).toLocaleDateString()}`);
    console.log('');
  });
}

function showHelp() {
  console.log(`
🔧 Admin Role Management Script

Usage:
  npx tsx scripts/make-admin.ts <command> [email]

Commands:
  promote <email>    Promote a user to admin
  revoke <email>     Remove admin access from a user
  list              List all administrators
  help              Show this help message

Examples:
  npx tsx scripts/make-admin.ts promote john@example.com
  npx tsx scripts/make-admin.ts revoke jane@example.com
  npx tsx scripts/make-admin.ts list

Notes:
  - Users must register first before being promoted
  - Requires SUPABASE_SERVICE_ROLE_KEY environment variable
  `);
}

async function main() {
  const command = process.argv[2];
  const email = process.argv[3];

  if (!command) {
    showHelp();
    process.exit(0);
  }

  switch (command.toLowerCase()) {
    case 'promote':
      if (!email) {
        console.error('❌ Error: Email address required');
        console.log('Usage: npx tsx scripts/make-admin.ts promote email@example.com');
        process.exit(1);
      }
      await promoteToAdmin(email);
      break;

    case 'revoke':
      if (!email) {
        console.error('❌ Error: Email address required');
        console.log('Usage: npx tsx scripts/make-admin.ts revoke email@example.com');
        process.exit(1);
      }
      await revokeAdmin(email);
      break;

    case 'list':
      await listAdmins();
      break;

    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;

    default:
      console.error(`❌ Unknown command: ${command}`);
      showHelp();
      process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Unexpected error:', error.message);
  process.exit(1);
});
