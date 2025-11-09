#!/usr/bin/env node

/**
 * Firestore Restore Script
 *
 * This script restores Firestore collections from backup JSON files.
 *
 * Usage: node scripts/restore-firestore.js <backup-file.json>
 * Example: node scripts/restore-firestore.js backups/users-2025-11-09.json
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

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

async function restoreCollection(backupFile) {
  console.log(`Restoring from ${backupFile}...`);

  try {
    // Read the backup file
    const backupPath = path.resolve(backupFile);
    if (!fs.existsSync(backupPath)) {
      console.error(`Error: Backup file not found: ${backupPath}`);
      return 0;
    }

    const data = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

    if (!Array.isArray(data)) {
      console.error('Error: Invalid backup file format. Expected an array of documents.');
      return 0;
    }

    // Extract collection name from filename
    const filename = path.basename(backupFile);
    const collectionName = filename.split('-')[0];

    console.log(`Restoring ${data.length} documents to ${collectionName} collection...`);

    // Create a batch for efficient writes
    const batch = db.batch();
    let count = 0;

    for (const doc of data) {
      const docRef = db.collection(collectionName).doc(doc.id);
      batch.set(docRef, doc.data);
      count++;

      // Firestore batch limit is 500 operations
      if (count % 500 === 0) {
        await batch.commit();
        console.log(`  Restored ${count}/${data.length} documents...`);
      }
    }

    // Commit any remaining documents
    if (count % 500 !== 0) {
      await batch.commit();
    }

    console.log(`✓ Successfully restored ${count} documents to ${collectionName} collection`);
    return count;
  } catch (error) {
    console.error(`✗ Error restoring collection:`, error.message);
    return 0;
  }
}

async function main() {
  const backupFile = process.argv[2];

  if (!backupFile) {
    console.error('Usage: node scripts/restore-firestore.js <backup-file.json>');
    console.error('Example: node scripts/restore-firestore.js backups/users-2025-11-09.json');
    process.exit(1);
  }

  console.log('Starting Firestore restore...\n');

  const count = await restoreCollection(backupFile);

  if (count > 0) {
    console.log(`\n✓ Restore complete!`);
  } else {
    console.log(`\n✗ Restore failed or no documents were restored.`);
  }

  process.exit(0);
}

main().catch(error => {
  console.error('Restore failed:', error);
  process.exit(1);
});
