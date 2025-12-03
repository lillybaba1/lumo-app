import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const email = process.argv[2] || 'lillyoldenburg01@gmail.com';

async function deleteUser() {
  console.log('Looking for user:', email);
  
  // Find user in auth
  const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Error listing users:', listError);
    return;
  }
  
  const authUser = authUsers.users.find(u => u.email === email);
  if (!authUser) {
    console.log('User not found in auth');
    return;
  }
  
  console.log('Found auth user:', authUser.id);
  
  // Delete from business_accounts first (FK constraint)
  const { error: bizError } = await supabase
    .from('business_accounts')
    .delete()
    .eq('owner_user_id', authUser.id);
  if (bizError) console.log('business_accounts delete:', bizError.message);
  else console.log('✓ Deleted from business_accounts');
  
  // Delete from users table
  const { error: usersError } = await supabase
    .from('users')
    .delete()
    .eq('id', authUser.id);
  if (usersError) console.log('users delete:', usersError.message);
  else console.log('✓ Deleted from users table');
  
  // Delete from user_profiles (if exists)
  const { error: profileError } = await supabase
    .from('user_profiles')
    .delete()
    .eq('id', authUser.id);
  if (profileError && !profileError.message.includes('does not exist')) {
    console.log('user_profiles delete:', profileError.message);
  } else {
    console.log('✓ Deleted from user_profiles (or table does not exist)');
  }
  
  // Delete auth user
  const { error: authDeleteError } = await supabase.auth.admin.deleteUser(authUser.id);
  if (authDeleteError) console.log('Auth delete error:', authDeleteError.message);
  else console.log('✓ Deleted from auth');
  
  console.log('\n✅ Done! User completely removed.');
}

deleteUser();
