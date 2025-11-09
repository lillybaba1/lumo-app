#!/usr/bin/env node

/**
 * Firestore Backup Script
 *
 * This script backs up your Firestore database collections to JSON files.
 * Run this periodically to maintain backups of your data.
 *
 * Usage: node scripts/backup-firestore.js
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

// Collections to backup
const COLLECTIONS = ['users', 'products', 'orders', 'categories', 'reviews', 'settings'];

async function backupCollection(collectionName) {
  console.log(`Backing up ${collectionName} collection...`);

  try {
    const snapshot = await db.collection(collectionName).get();
    const data = [];

    snapshot.forEach(doc => {
      data.push({
        id: doc.id,
        data: doc.data()
      });
    });

    const backupDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = path.join(backupDir, `${collectionName}-${timestamp}.json`);

    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    console.log(`✓ Backed up ${data.length} documents to ${filename}`);

    return data.length;
  } catch (error) {
    console.error(`✗ Error backing up ${collectionName}:`, error.message);
    return 0;
  }
}

async function main() {
  console.log('Starting Firestore backup...\n');
  const timestamp = new Date().toISOString();
  console.log(`Backup started at: ${timestamp}\n`);

  let totalDocs = 0;

  for (const collection of COLLECTIONS) {
    const count = await backupCollection(collection);
    totalDocs += count;
  }

  console.log(`\n✓ Backup complete! Total documents backed up: ${totalDocs}`);
  console.log(`Backups saved in: ${path.join(__dirname, '../backups')}`);

  process.exit(0);
}

main().catch(error => {
  console.error('Backup failed:', error);
  process.exit(1);
});
