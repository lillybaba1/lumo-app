/**
 * Script to make the first admin user
 * Usage: npx tsx scripts/make-first-admin.ts user@example.com
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing environment variables!');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function makeFirstAdmin(email: string) {
  try {
    console.log(`🔍 Searching for user with email: ${email}`);

    // Find the user
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (findError || !user) {
      console.error('❌ User not found with email:', email);
      console.error('Error:', findError);
      process.exit(1);
    }

    console.log(`✅ Found user:`, {
      id: user.id,
      email: user.email,
      name: user.name,
      currentRole: user.role,
    });

    if (user.role === 'admin') {
      console.log('ℹ️  User is already an admin!');
      process.exit(0);
    }

    // Update to admin
    console.log('🔄 Updating user to admin role...');
    const { error: updateError } = await supabase
      .from('users')
      .update({ role: 'admin' })
      .eq('id', user.id);

    if (updateError) {
      console.error('❌ Failed to update user role:', updateError);
      process.exit(1);
    }

    console.log('✅ Successfully promoted user to admin!');
    console.log(`🎉 ${user.email} is now an admin.`);
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('❌ Usage: npx tsx scripts/make-first-admin.ts user@example.com');
  process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  console.error('❌ Invalid email format:', email);
  process.exit(1);
}

makeFirstAdmin(email);
