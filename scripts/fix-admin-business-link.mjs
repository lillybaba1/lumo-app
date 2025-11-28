/**
 * Fix Admin Business Link
 * Updates admin user to link to business account
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixAdminLink() {
  console.log('🔧 Fixing Admin Business Account Link...\n');

  // Get business account
  const { data: business, error: bizError } = await supabase
    .from('business_accounts')
    .select('*')
    .limit(1)
    .single();

  if (bizError || !business) {
    console.error('❌ No business account found');
    process.exit(1);
  }

  console.log(`Found business: ${business.business_name} (${business.id})`);
  console.log(`Owner user ID: ${business.owner_user_id}\n`);

  // Update ALL admin users to link to this business account
  const { data: updated, error: updateError } = await supabase
    .from('user_profiles')
    .update({ business_account_id: business.id })
    .or('role.eq.APP_OWNER_ADMIN,role.eq.admin')
    .select();

  if (updateError) {
    console.error('❌ Failed to update:', updateError.message);
    process.exit(1);
  }

  console.log(`✅ Updated ${updated?.length || 0} admin user(s)`);
  updated?.forEach(u => {
    console.log(`   - ${u.email} → business_account_id: ${u.business_account_id}`);
  });

  console.log('\n✅ Done!');
}

fixAdminLink().catch(console.error);
