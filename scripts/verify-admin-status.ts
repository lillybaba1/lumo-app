
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyAdminStatus(emailOrId: string) {
  console.log(`Verifying admin status for: ${emailOrId}`);

  // 1. Check Auth User
  let userId = emailOrId;
  if (emailOrId.includes('@')) {
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    const user = users.find(u => u.email === emailOrId);
    if (!user) {
      console.error('User not found in Auth');
      return;
    }
    userId = user.id;
    console.log(`Found Auth User ID: ${userId}`);
  }

  // 2. Check users table
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (userError) {
    console.log('Error fetching from users table:', userError.message);
  } else {
    console.log('Users Table Entry:', userData);
  }

  // 3. Check user_profiles table
  const { data: profileData, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileError) {
    console.log('Error fetching from user_profiles table:', profileError.message);
  } else {
    console.log('User Profiles Table Entry:', profileData);
  }

  // 4. Determine Effective Role
  let role = 'customer';
  if (profileData?.role === 'admin' || userData?.role === 'admin') {
    role = 'admin';
  } else {
    role = profileData?.role || userData?.role || 'customer';
  }

  console.log('-----------------------------------');
  console.log(`Effective Role in App: ${role}`);
  console.log('-----------------------------------');
}

const target = process.argv[2];
if (!target) {
  console.log('Usage: npx tsx scripts/verify-admin-status.ts <email_or_user_id>');
} else {
  verifyAdminStatus(target);
}
