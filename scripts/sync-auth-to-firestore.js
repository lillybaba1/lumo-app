#!/usr/bin/env node

/**
 * Sync Firebase Auth Users to Firestore
 *
 * This script creates or updates Firestore user documents based on Firebase Authentication data.
 * Use this to recover the users collection after accidental deletion.
 *
 * Usage: node scripts/sync-auth-to-firestore.js
 */

const admin = require('firebase-admin');

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

async function syncAuthUsersToFirestore() {
  console.log('Fetching users from Firebase Authentication...\n');

  let syncedCount = 0;
  let errorCount = 0;

  try {
    // List all users from Firebase Auth
    const listUsersResult = await admin.auth().listUsers(1000);

    console.log(`Found ${listUsersResult.users.length} users in Firebase Authentication\n`);

    if (listUsersResult.users.length === 0) {
      console.log('No users found in Firebase Authentication.');
      console.log('Users will be created in Firestore when they sign up.');
      return;
    }

    // Process each user
    for (const userRecord of listUsersResult.users) {
      try {
        // Check if user document already exists in Firestore
        const userDocRef = db.collection('users').doc(userRecord.uid);
        const userDoc = await userDocRef.get();

        const userData = {
          uid: userRecord.uid,
          email: userRecord.email || '',
          name: userRecord.displayName || userRecord.email?.split('@')[0] || 'User',
          createdAt: userRecord.metadata.creationTime || new Date().toISOString(),
          role: 'customer', // Default role
        };

        // Add phone number if available
        if (userRecord.phoneNumber) {
          userData.phoneNumber = userRecord.phoneNumber;
          userData.phoneVerified = true;
        }

        if (userDoc.exists) {
          // Update existing document, preserving any additional fields
          await userDocRef.update({
            email: userData.email,
            ...(userRecord.displayName && { name: userRecord.displayName }),
            ...(userRecord.phoneNumber && {
              phoneNumber: userRecord.phoneNumber,
              phoneVerified: true
            }),
          });
          console.log(`✓ Updated user: ${userData.email} (${userRecord.uid})`);
        } else {
          // Create new document
          await userDocRef.set(userData);
          console.log(`✓ Created user: ${userData.email} (${userRecord.uid})`);
        }

        syncedCount++;
      } catch (error) {
        console.error(`✗ Error syncing user ${userRecord.uid}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n─────────────────────────────────────`);
    console.log(`✓ Sync complete!`);
    console.log(`  Synced: ${syncedCount} users`);
    if (errorCount > 0) {
      console.log(`  Errors: ${errorCount} users`);
    }
    console.log(`─────────────────────────────────────\n`);
  } catch (error) {
    console.error('Error listing users:', error);
    throw error;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('  Syncing Firebase Auth Users to Firestore');
  console.log('═══════════════════════════════════════════════\n');

  await syncAuthUsersToFirestore();

  process.exit(0);
}

main().catch(error => {
  console.error('Sync failed:', error);
  process.exit(1);
});
