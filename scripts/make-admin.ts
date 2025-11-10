#!/usr/bin/env node

/**
 * Script to promote a user to admin role
 * Usage: npx tsx scripts/make-admin.ts user@example.com
 */

import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function makeAdmin(email: string) {
  try {
    console.log(`\n🔍 Looking for user: ${email}`);

    // Find user by email
    const { data: users, error: userError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (userError) {
      if (userError.code === 'PGRST116') {
        console.error(`❌ User not found: ${email}`);
        console.error('Please make sure the user has registered an account first.');
        process.exit(1);
      }
      throw userError;
    }

    console.log(`✅ Found user: ${users.name || email}`);
    console.log(`   Current role: ${users.role || 'user'}`);

    if (users.role === 'admin') {
      console.log('ℹ️  User is already an admin!');
      return;
    }

    // Update to admin
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ 
        role: 'admin',
        updated_at: new Date().toISOString()
      })
      .eq('id', users.id);

    if (updateError) {
      throw updateError;
    }

    console.log(`✅ Successfully promoted ${email} to admin!`);
    console.log(`\n🎉 ${users.name || email} is now an administrator`);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

async function revokeAdmin(email: string) {
  try {
    console.log(`\n🔍 Looking for admin: ${email}`);

    // Find user by email
    const { data: users, error: userError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (userError) {
      if (userError.code === 'PGRST116') {
        console.error(`❌ User not found: ${email}`);
        process.exit(1);
      }
      throw userError;
    }

    console.log(`✅ Found user: ${users.name || email}`);
    console.log(`   Current role: ${users.role || 'user'}`);

    if (users.role !== 'admin') {
      console.log('ℹ️  User is not an admin.');
      return;
    }

    // Revoke admin
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ 
        role: 'user',
        updated_at: new Date().toISOString()
      })
      .eq('id', users.id);

    if (updateError) {
      throw updateError;
    }

    console.log(`✅ Successfully revoked admin role from ${email}`);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

async function listAdmins() {
  try {
    console.log('\n📋 Current Admins:\n');

    const { data: admins, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('role', 'admin')
      .order('created_at', { ascending: true });

    if (error) throw error;

    if (!admins || admins.length === 0) {
      console.log('   No admins found.');
      return;
    }

    admins.forEach((admin, index) => {
      console.log(`   ${index + 1}. ${admin.name || 'N/A'}`);
      console.log(`      Email: ${admin.email}`);
      console.log(`      ID: ${admin.id}`);
      console.log(`      Created: ${new Date(admin.created_at).toLocaleDateString()}\n`);
    });

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║              Lumo Admin Management Script                  ║
╚════════════════════════════════════════════════════════════╝

Usage:
  npx tsx scripts/make-admin.ts <command> [email]

Commands:
  promote <email>    Promote a user to admin
  revoke <email>     Revoke admin privileges from a user
  list               List all current admins

Examples:
  npx tsx scripts/make-admin.ts promote user@example.com
  npx tsx scripts/make-admin.ts revoke admin@example.com
  npx tsx scripts/make-admin.ts list
    `);
    process.exit(0);
  }

  switch (command) {
    case 'promote':
      if (!args[1]) {
        console.error('❌ Error: Email required');
        console.log('Usage: npx tsx scripts/make-admin.ts promote user@example.com');
        process.exit(1);
      }
      await makeAdmin(args[1]);
      break;

    case 'revoke':
      if (!args[1]) {
        console.error('❌ Error: Email required');
        console.log('Usage: npx tsx scripts/make-admin.ts revoke user@example.com');
        process.exit(1);
      }
      await revokeAdmin(args[1]);
      break;

    case 'list':
      await listAdmins();
      break;

    default:
      console.error(`❌ Unknown command: ${command}`);
      console.log('Valid commands: promote, revoke, list');
      process.exit(1);
  }
}

main().catch(console.error);
