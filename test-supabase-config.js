#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Checking Supabase Configuration...\n');

// Check environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('📋 Environment Variables Check:');
console.log(`✅ NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✓ Set' : '❌ Missing'}`);
console.log(`✅ NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✓ Set' : '❌ Missing'}`);
console.log(`✅ SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✓ Set' : '❌ Missing'}\n`);

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('❌ Missing required Supabase environment variables!');
  process.exit(1);
}

// Test URL format
const urlPattern = /^https:\/\/[a-z0-9-]+\.supabase\.co$/;
if (!urlPattern.test(supabaseUrl)) {
  console.log('⚠️  Supabase URL format looks unusual. Expected format: https://[project-id].supabase.co');
} else {
  console.log('✅ Supabase URL format is correct');
}

// Extract project ID from URL
const projectId = supabaseUrl.replace('https://', '').replace('.supabase.co', '');
console.log(`📍 Project ID: ${projectId}\n`);

// Test connection with anon key
console.log('🔌 Testing Connection...');
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    // Test basic connection
    const { data, error } = await supabase.from('users').select('count').limit(0);
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('✅ Connection successful! (Table "users" not found - this is expected if migrations haven\'t been run)');
      } else {
        console.log(`⚠️  Connection successful but got error: ${error.message}`);
        console.log(`   Code: ${error.code}`);
      }
    } else {
      console.log('✅ Connection successful! Can query the database.');
    }

    // Test auth
    const { data: authData, error: authError } = await supabase.auth.getSession();
    if (authError) {
      console.log(`⚠️  Auth test error: ${authError.message}`);
    } else {
      console.log('✅ Auth service is accessible');
    }

  } catch (err) {
    console.log(`❌ Connection failed: ${err.message}`);
    console.log('\nPossible issues:');
    console.log('- Check if your Supabase project is active');
    console.log('- Verify your API keys are correct');
    console.log('- Check your internet connection');
    console.log('- Ensure your Supabase project hasn\'t been paused');
  }
}

// Test service role key if available
async function testServiceRole() {
  if (!supabaseServiceKey) {
    console.log('⚠️  Service role key not configured - admin operations will not work');
    return;
  }

  console.log('\n🔑 Testing Service Role Key...');
  const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Try to access auth admin
    const { data, error } = await adminSupabase.auth.admin.listUsers();
    
    if (error) {
      console.log(`⚠️  Service role test error: ${error.message}`);
    } else {
      console.log('✅ Service role key is working correctly');
      console.log(`📊 Total users in auth: ${data.users.length}`);
    }
  } catch (err) {
    console.log(`❌ Service role test failed: ${err.message}`);
  }
}

// Run tests
testConnection().then(() => {
  return testServiceRole();
}).then(() => {
  console.log('\n🎉 Supabase configuration check complete!');
}).catch((err) => {
  console.error('Test failed:', err);
});
