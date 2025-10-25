#!/usr/bin/env node

/**
 * Firebase Environment Variables Verification Script
 *
 * Run this script to check if your Firebase credentials are properly configured.
 *
 * Usage: node scripts/verify-firebase-env.js
 */

require('dotenv').config({ path: '.env.local' });

console.log('\n🔍 Checking Firebase Environment Variables...\n');

let hasErrors = false;

// Check Google AI API Key
console.log('1. Google AI API Key (GOOGLE_API_KEY):');
if (process.env.GOOGLE_API_KEY) {
  if (process.env.GOOGLE_API_KEY === 'your_google_api_key_here') {
    console.log('   ⚠️  Found placeholder value - Please replace with actual API key');
    hasErrors = true;
  } else {
    console.log('   ✅ Set (length: ' + process.env.GOOGLE_API_KEY.length + ' chars)');
  }
} else {
  console.log('   ❌ NOT SET - AI assistant will not work');
  hasErrors = true;
}

// Check Firebase Service Account JSON
console.log('\n2. Firebase Service Account (FIREBASE_SERVICE_ACCOUNT_JSON):');
if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (json.includes('REPLACE_WITH_YOUR')) {
    console.log('   ❌ Found placeholder value - Please replace with actual credentials');
    console.log('   📖 See FIREBASE_SETUP.md for instructions');
    hasErrors = true;
  } else {
    try {
      const parsed = JSON.parse(json);
      if (parsed.project_id === 'lumo-app-183f5') {
        console.log('   ✅ Valid JSON for project: ' + parsed.project_id);
        console.log('   ✅ Client email: ' + parsed.client_email);
        if (parsed.private_key && parsed.private_key.includes('BEGIN PRIVATE KEY')) {
          console.log('   ✅ Private key found');
        } else {
          console.log('   ⚠️  Private key might be malformed');
          hasErrors = true;
        }
      } else {
        console.log('   ⚠️  Project ID mismatch: ' + parsed.project_id + ' (expected: lumo-app-183f5)');
        hasErrors = true;
      }
    } catch (e) {
      console.log('   ❌ Invalid JSON format: ' + e.message);
      console.log('   📖 Check that quotes are properly escaped');
      hasErrors = true;
    }
  }
} else {
  console.log('   ❌ NOT SET - Signup and authentication will fail');
  console.log('   📖 See FIREBASE_SETUP.md for setup instructions');
  hasErrors = true;
}

// Check alternative: Base64
console.log('\n3. Firebase Service Account Base64 (FIREBASE_SERVICE_ACCOUNT_BASE64):');
if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
  console.log('   ℹ️  Set (alternative method)');
} else {
  console.log('   —  Not set (optional, JSON method is preferred)');
}

// Check alternative: File path
console.log('\n4. Google Application Credentials (GOOGLE_APPLICATION_CREDENTIALS):');
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.log('   ℹ️  Set to: ' + process.env.GOOGLE_APPLICATION_CREDENTIALS);
} else {
  console.log('   —  Not set (optional, JSON method is preferred)');
}

// Summary
console.log('\n' + '='.repeat(60));
if (hasErrors) {
  console.log('❌ Configuration incomplete - Please fix the issues above');
  console.log('\n📖 For detailed setup instructions, see FIREBASE_SETUP.md');
  console.log('🔗 Firebase Console: https://console.firebase.google.com/project/lumo-app-183f5');
  process.exit(1);
} else {
  console.log('✅ All environment variables are properly configured!');
  console.log('\n🚀 You can now:');
  console.log('   - Sign up new users');
  console.log('   - Log in to existing accounts');
  console.log('   - Use the AI assistant');
  console.log('   - Access admin panel');
  process.exit(0);
}
