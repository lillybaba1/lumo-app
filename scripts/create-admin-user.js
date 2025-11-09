#!/usr/bin/env node

/**
 * Create Admin User Script
 *
 * Creates an admin user in Firebase Authentication and Firestore.
 * This is useful for setting up your first admin account.
 *
 * Usage: node scripts/create-admin-user.js
 */

const admin = require('firebase-admin');
const readline = require('readline');

// Initialize Firebase Admin
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!serviceAccountPath) {
  console.error('Error: GOOGLE_APPLICATION_CREDENTIALS environment variable not set');
  console.error('Please set it to the path of your service account key JSON file');
  process.exit(1);
}

try {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  console.error('Error initializing Firebase Admin:', error.message);
  process.exit(1);
}

const db = admin.firestore();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createAdminUser() {
  console.log('═══════════════════════════════════════════════');
  console.log('  Create Admin User');
  console.log('═══════════════════════════════════════════════\n');

  try {
    // Get user input
    const email = await question('Admin Email: ');
    const password = await question('Password (min 6 characters): ');
    const name = await question('Display Name: ');
    const phoneNumber = await question('Phone Number (with country code, e.g., +1234567890): ');

    // Validate inputs
    if (!email || !email.includes('@')) {
      console.error('\n✗ Error: Invalid email address');
      process.exit(1);
    }

    if (!password || password.length < 6) {
      console.error('\n✗ Error: Password must be at least 6 characters');
      process.exit(1);
    }

    if (!name) {
      console.error('\n✗ Error: Display name is required');
      process.exit(1);
    }

    if (phoneNumber && !phoneNumber.match(/^\+?[1-9]\d{1,14}$/)) {
      console.error('\n✗ Error: Invalid phone number format. Use international format (e.g., +1234567890)');
      process.exit(1);
    }

    console.log('\nCreating admin user...\n');

    // Create user in Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: name,
      ...(phoneNumber && { phoneNumber: phoneNumber }),
      emailVerified: true, // Auto-verify admin email
    });

    console.log(`✓ Created Firebase Auth user: ${userRecord.uid}`);

    // Create user document in Firestore
    const userData = {
      uid: userRecord.uid,
      email: email,
      name: name,
      role: 'admin', // Set as admin
      createdAt: new Date().toISOString(),
    };

    // Add phone number if provided
    if (phoneNumber) {
      userData.phoneNumber = phoneNumber;
      userData.phoneVerified = true;
    }

    await db.collection('users').doc(userRecord.uid).set(userData);

    console.log(`✓ Created Firestore user document`);

    console.log(`\n─────────────────────────────────────`);
    console.log(`✓ Admin user created successfully!`);
    console.log(`─────────────────────────────────────`);
    console.log(`\nUser Details:`);
    console.log(`  UID: ${userRecord.uid}`);
    console.log(`  Email: ${email}`);
    console.log(`  Name: ${name}`);
    console.log(`  Role: admin`);
    if (phoneNumber) {
      console.log(`  Phone: ${phoneNumber}`);
    }
    console.log(`\nYou can now log in at: https://lumo-app.org/admin/login`);
    console.log(`─────────────────────────────────────\n`);

  } catch (error) {
    console.error('\n✗ Error creating admin user:', error.message);

    if (error.code === 'auth/email-already-exists') {
      console.error('\nThis email is already registered.');
      console.error('If you need to make this user an admin, update their role in Firestore:');
      console.error('  1. Go to Firebase Console → Firestore');
      console.error('  2. Open the users collection');
      console.error('  3. Find the user document by email');
      console.error('  4. Change the "role" field from "customer" to "admin"\n');
    }

    process.exit(1);
  } finally {
    rl.close();
  }
}

async function main() {
  await createAdminUser();
  process.exit(0);
}

main();
