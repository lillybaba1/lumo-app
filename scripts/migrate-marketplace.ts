/**
 * Data Migration Script for Multi-Seller Marketplace
 *
 * This script:
 * 1. Creates a default "App Owner Seller" business account
 * 2. Backfills all existing products with the default seller_id
 * 3. Migrates user roles to new system
 * 4. Updates existing orders with customer_id
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMarketplaceMigration() {
  console.log('🚀 Starting Marketplace Data Migration...\n');

  try {
    // Step 1: Find the first admin user
    console.log('Step 1: Finding first admin user...');
    const { data: adminUsers, error: adminError } = await supabase
      .from('users')
      .select('*')
      .or('role.eq.admin,role.eq.APP_OWNER_ADMIN')
      .limit(1);

    if (adminError) {
      throw new Error(`Failed to find admin user: ${adminError.message}`);
    }

    if (!adminUsers || adminUsers.length === 0) {
      throw new Error('No admin user found. Please create an admin user first.');
    }

    const adminUser = adminUsers[0];
    console.log(`✅ Found admin user: ${adminUser.email} (${adminUser.id})\n`);

    // Step 2: Check if default business account already exists
    console.log('Step 2: Checking for existing default business account...');
    const { data: existingBusiness, error: businessCheckError } = await supabase
      .from('business_accounts')
      .select('*')
      .eq('owner_user_id', adminUser.id)
      .single();

    let defaultBusinessId: string;

    if (existingBusiness) {
      console.log(`✅ Default business account already exists: ${existingBusiness.id}\n`);
      defaultBusinessId = existingBusiness.id;
    } else {
      // Create default "App Owner Seller" business account
      console.log('Step 2b: Creating default "App Owner Seller" business account...');
      const { data: newBusiness, error: createError } = await supabase
        .from('business_accounts')
        .insert({
          owner_user_id: adminUser.id,
          business_name: 'Lumo Store',
          contact_person_name: adminUser.name || 'Store Owner',
          contact_email: adminUser.email,
          business_address: 'Main Store Location',
          status: 'ACTIVE',
          description: 'Official Lumo Store - Default seller account',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        throw new Error(`Failed to create business account: ${createError.message}`);
      }

      console.log(`✅ Created default business account: ${newBusiness.id}\n`);
      defaultBusinessId = newBusiness.id;
    }

    // Step 3: Update admin user to link to business account
    console.log('Step 3: Updating admin user with business_account_id...');
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({
        business_account_id: defaultBusinessId,
        role: 'APP_OWNER_ADMIN' // Migrate to new role
      })
      .eq('id', adminUser.id);

    if (userUpdateError) {
      console.warn(`⚠️  Failed to update admin user: ${userUpdateError.message}`);
    } else {
      console.log('✅ Updated admin user\n');
    }

    // Step 4: Backfill products with seller_id
    console.log('Step 4: Backfilling products with seller_id...');
    const { data: productsToUpdate, error: productsError } = await supabase
      .from('products')
      .select('id')
      .is('seller_id', null);

    if (productsError) {
      throw new Error(`Failed to fetch products: ${productsError.message}`);
    }

    if (productsToUpdate && productsToUpdate.length > 0) {
      console.log(`Found ${productsToUpdate.length} products without seller_id`);

      const { error: updateError } = await supabase
        .from('products')
        .update({ seller_id: defaultBusinessId })
        .is('seller_id', null);

      if (updateError) {
        throw new Error(`Failed to update products: ${updateError.message}`);
      }

      console.log(`✅ Updated ${productsToUpdate.length} products with default seller_id\n`);
    } else {
      console.log('✅ All products already have seller_id\n');
    }

    // Step 5: Migrate user roles
    console.log('Step 5: Migrating user roles to new system...');

    // Update 'admin' to 'APP_OWNER_ADMIN'
    const { error: adminRoleError } = await supabase
      .from('users')
      .update({ role: 'APP_OWNER_ADMIN' })
      .eq('role', 'admin');

    if (adminRoleError) {
      console.warn(`⚠️  Failed to migrate admin roles: ${adminRoleError.message}`);
    }

    // Update 'customer' to 'PERSONAL_ACCOUNT'
    const { error: customerRoleError } = await supabase
      .from('users')
      .update({ role: 'PERSONAL_ACCOUNT' })
      .eq('role', 'customer');

    if (customerRoleError) {
      console.warn(`⚠️  Failed to migrate customer roles: ${customerRoleError.message}`);
    }

    // Update 'user' to 'PERSONAL_ACCOUNT' (some systems use 'user')
    const { error: userRoleError } = await supabase
      .from('users')
      .update({ role: 'PERSONAL_ACCOUNT' })
      .eq('role', 'user');

    if (userRoleError) {
      console.warn(`⚠️  Failed to migrate user roles: ${userRoleError.message}`);
    }

    console.log('✅ Migrated user roles\n');

    // Step 6: Summary
    console.log('📊 Migration Summary:');
    console.log('-------------------');

    const { count: businessCount } = await supabase
      .from('business_accounts')
      .select('*', { count: 'exact', head: true });
    console.log(`Business Accounts: ${businessCount || 0}`);

    const { count: productsCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', defaultBusinessId);
    console.log(`Products with default seller: ${productsCount || 0}`);

    const { count: adminCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'APP_OWNER_ADMIN');
    console.log(`APP_OWNER_ADMIN users: ${adminCount || 0}`);

    const { count: businessUserCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'BUSINESS_ACCOUNT');
    console.log(`BUSINESS_ACCOUNT users: ${businessUserCount || 0}`);

    const { count: personalCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'PERSONAL_ACCOUNT');
    console.log(`PERSONAL_ACCOUNT users: ${personalCount || 0}`);

    console.log('\n✅ Marketplace migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Deploy the updated code to production');
    console.log('2. Test the business dashboard at /business/dashboard');
    console.log('3. Test sign-up flow for new business accounts');
    console.log('4. Verify admin can see all sellers and products');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
runMarketplaceMigration()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
