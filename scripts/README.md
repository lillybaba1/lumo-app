# Firestore Backup & Recovery Scripts

This directory contains utility scripts for backing up and recovering your Firestore database.

## Prerequisites

Before running these scripts, you need to set up your Firebase Admin SDK credentials:

1. Download your service account key from Firebase Console:
   - Go to: https://console.firebase.google.com/project/lumo-app-183f5/settings/serviceaccounts/adminsdk
   - Click "Generate new private key"
   - Save the JSON file securely (e.g., `service-account-key.json`)

2. Set the environment variable:
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
   ```

## Scripts

### 1. Backup Firestore (`backup-firestore.js`)

Backs up all Firestore collections to JSON files with timestamps.

**Usage:**
```bash
node scripts/backup-firestore.js
```

**What it does:**
- Exports all collections: users, products, orders, categories, reviews, settings
- Saves each collection to `backups/<collection>-<timestamp>.json`
- Preserves all document data and IDs

**Recommended:**
- Run this daily or weekly using a cron job
- Keep backups in a secure location
- Consider uploading backups to cloud storage

### 2. Restore Firestore (`restore-firestore.js`)

Restores a Firestore collection from a backup file.

**Usage:**
```bash
node scripts/restore-firestore.js backups/users-2025-11-09T10-30-00-000Z.json
```

**What it does:**
- Reads the backup JSON file
- Restores all documents to Firestore
- Uses batch writes for efficiency (500 docs per batch)
- Preserves original document IDs

**Warning:**
- This will overwrite existing documents with the same IDs
- Make a backup before restoring if you're unsure

### 3. Sync Auth to Firestore (`sync-auth-to-firestore.js`)

Syncs Firebase Authentication users to Firestore user documents.

**Usage:**
```bash
node scripts/sync-auth-to-firestore.js
```

**What it does:**
- Fetches all users from Firebase Authentication
- Creates/updates corresponding Firestore user documents
- Preserves existing Firestore data (only updates specific fields)
- Adds phone numbers if available in Auth

**Use cases:**
- Recover users collection after accidental deletion
- Sync new Firebase Auth users to Firestore
- Update user data from Auth (email, phone, etc.)

## Recovery Scenarios

### Scenario 1: Users Collection Deleted

If your users collection was accidentally deleted:

1. Run the sync script to recreate user documents from Firebase Auth:
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
   node scripts/sync-auth-to-firestore.js
   ```

2. If you have a recent backup, you can restore additional user data:
   ```bash
   node scripts/restore-firestore.js backups/users-YYYY-MM-DD.json
   ```

### Scenario 2: Other Collections Deleted

If products, orders, or other collections were deleted:

1. Restore from the most recent backup:
   ```bash
   node scripts/restore-firestore.js backups/<collection>-<timestamp>.json
   ```

### Scenario 3: Prevent Future Data Loss

Set up regular backups:

1. Create a cron job to run backups daily:
   ```bash
   crontab -e
   ```

2. Add this line (runs at 2 AM daily):
   ```
   0 2 * * * cd /home/heilige/lumo-app && /usr/bin/node scripts/backup-firestore.js
   ```

## Important Notes

- **Service Account Key**: Keep your service account key file secure and never commit it to git
- **Backup Storage**: Store backups in a secure location, preferably off-site
- **Testing**: Test restore procedures on a development project before using on production
- **Firestore Rules**: Consider adding security rules to prevent accidental bulk deletions

## Firestore Security Rules

To prevent accidental mass deletions through the console or API, add this to your Firestore rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Prevent deletion of entire collections
    match /{collection}/{document} {
      allow delete: if request.auth != null &&
                       get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## Support

For questions or issues with these scripts, check the Firebase documentation:
- Firestore Admin SDK: https://firebase.google.com/docs/firestore/server/admin
- Firebase Auth Admin: https://firebase.google.com/docs/auth/admin
