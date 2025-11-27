#!/usr/bin/env node

/**
 * Test Supabase database connection and check if products table exists
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

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('🔍 Testing Supabase connection...\n');

async function testConnection() {
  try {
    // Test 1: Check if products table exists
    console.log('1. Checking if products table exists...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('count')
      .limit(1);

    if (productsError) {
      console.error('   ❌ Products table error:', productsError.message);
      console.error('   Details:', productsError);
    } else {
      console.log('   ✅ Products table exists');
    }

    // Test 2: Check if categories table exists
    console.log('\n2. Checking if categories table exists...');
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .limit(5);

    if (categoriesError) {
      console.error('   ❌ Categories table error:', categoriesError.message);
    } else {
      console.log('   ✅ Categories table exists');
      console.log(`   Found ${categories.length} categories:`, categories.map(c => c.name).join(', '));
    }

    // Test 3: Try to insert a test product
    console.log('\n3. Testing product insertion...');
    const testProduct = {
      name: 'Test Product ' + Date.now(),
      description: 'Test description',
      price: 9.99,
      category_id: categories[0]?.id || null,
      stock: 10,
      is_active: true,
    };

    const { data: insertedProduct, error: insertError } = await supabase
      .from('products')
      .insert(testProduct)
      .select()
      .single();

    if (insertError) {
      console.error('   ❌ Failed to insert test product:', insertError.message);
      console.error('   Details:', insertError);

      // Check specific error codes
      if (insertError.code === '42P01') {
        console.error('\n   ⚠️  ERROR: Products table does not exist!');
        console.error('   You need to run the database migrations.');
        console.error('   \n   Run: npx supabase db push');
      } else if (insertError.code === '23505') {
        console.error('\n   ⚠️  Unique constraint violation (this is OK for testing)');
      }
    } else {
      console.log('   ✅ Successfully inserted test product:', insertedProduct.name);

      // Clean up - delete the test product
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', insertedProduct.id);

      if (!deleteError) {
        console.log('   ✅ Test product cleaned up');
      }
    }

    // Test 4: Check users table for admin
    console.log('\n4. Checking admin user...');
    const { data: adminUsers, error: adminError } = await supabase
      .from('users')
      .select('email, role')
      .eq('role', 'admin');

    if (adminError) {
      console.error('   ❌ Error checking admin users:', adminError.message);
    } else if (adminUsers.length === 0) {
      console.error('   ⚠️  No admin users found');
    } else {
      console.log(`   ✅ Found ${adminUsers.length} admin user(s):`);
      adminUsers.forEach(u => console.log(`      - ${u.email}`));
    }

    console.log('\n✅ Database connection test completed!\n');
  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
    process.exit(1);
  }
}

testConnection();
