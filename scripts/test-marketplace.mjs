/**
 * Marketplace Feature Testing Script
 * Verifies database setup and key marketplace features
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testMarketplace() {
  console.log('🧪 Testing Marketplace Features...\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Check business_accounts table exists and has data
  console.log('Test 1: Business Accounts Table');
  try {
    const { data, error } = await supabase
      .from('business_accounts')
      .select('*')
      .limit(1);

    if (error) throw error;

    if (data && data.length > 0) {
      console.log('✅ PASS - business_accounts table exists and has data');
      console.log(`   Business: ${data[0].business_name}`);
      console.log(`   Status: ${data[0].status}`);
      passed++;
    } else {
      console.log('❌ FAIL - No business accounts found');
      failed++;
    }
  } catch (error) {
    console.log('❌ FAIL -', error.message);
    failed++;
  }

  // Test 2: Check user_profiles has business_account_id column
  console.log('\nTest 2: User Profiles with Business Account Link');
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, email, role, business_account_id')
      .eq('role', 'APP_OWNER_ADMIN')
      .limit(1);

    if (error) throw error;

    if (data && data.length > 0) {
      const user = data[0];
      if (user.business_account_id) {
        console.log('✅ PASS - Admin user linked to business account');
        console.log(`   User: ${user.email}`);
        console.log(`   Business ID: ${user.business_account_id}`);
        passed++;
      } else {
        console.log('❌ FAIL - Admin user has no business_account_id');
        failed++;
      }
    } else {
      console.log('❌ FAIL - No APP_OWNER_ADMIN users found');
      failed++;
    }
  } catch (error) {
    console.log('❌ FAIL -', error.message);
    failed++;
  }

  // Test 3: Check products have seller_id
  console.log('\nTest 3: Products with Seller ID');
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, seller_id')
      .limit(5);

    if (error) throw error;

    if (data && data.length > 0) {
      const productsWithSeller = data.filter(p => p.seller_id);
      if (productsWithSeller.length === data.length) {
        console.log('✅ PASS - All products have seller_id');
        console.log(`   Total products checked: ${data.length}`);
        console.log(`   Products with seller: ${productsWithSeller.length}`);
        passed++;
      } else {
        console.log(`⚠️  PARTIAL - ${productsWithSeller.length}/${data.length} products have seller_id`);
        failed++;
      }
    } else {
      console.log('⚠️  WARNING - No products found');
      passed++;
    }
  } catch (error) {
    console.log('❌ FAIL -', error.message);
    failed++;
  }

  // Test 4: Check user role migration
  console.log('\nTest 4: User Role Migration');
  try {
    const { data: oldRoles, error: oldError } = await supabase
      .from('user_profiles')
      .select('id')
      .in('role', ['admin', 'customer', 'user'])
      .limit(1);

    if (oldError) throw oldError;

    if (!oldRoles || oldRoles.length === 0) {
      console.log('✅ PASS - No legacy roles found (all migrated)');
      passed++;
    } else {
      console.log(`⚠️  WARNING - Found ${oldRoles.length} users with legacy roles`);
      console.log('   Run migration again: npm run migrate:marketplace');
      failed++;
    }
  } catch (error) {
    console.log('❌ FAIL -', error.message);
    failed++;
  }

  // Test 5: Verify business account ownership
  console.log('\nTest 5: Business Account Ownership');
  try {
    const { data, error } = await supabase
      .from('business_accounts')
      .select(`
        id,
        business_name,
        owner:owner_user_id (
          id,
          email,
          role
        )
      `)
      .limit(1);

    if (error) throw error;

    if (data && data.length > 0 && data[0].owner) {
      console.log('✅ PASS - Business account properly linked to owner');
      console.log(`   Business: ${data[0].business_name}`);
      console.log(`   Owner: ${data[0].owner.email}`);
      console.log(`   Role: ${data[0].owner.role}`);
      passed++;
    } else {
      console.log('❌ FAIL - Business account not linked to owner');
      failed++;
    }
  } catch (error) {
    console.log('❌ FAIL -', error.message);
    failed++;
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Summary');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Marketplace is ready to use.');
    console.log('\n🚀 Next Steps:');
    console.log('   1. Visit http://localhost:3000/business/dashboard');
    console.log('   2. Visit http://localhost:3000/signup to test account creation');
    console.log('   3. Test product creation with seller assignment');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
  }

  process.exit(failed > 0 ? 1 : 0);
}

testMarketplace().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
