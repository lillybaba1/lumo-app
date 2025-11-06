require('dotenv').config({ path: '.env.local' });

async function testStorage() {
  try {
    console.log('Testing Firebase Admin Storage...\n');

    const admin = require('firebase-admin');

    // Initialize admin
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });

    console.log('✅ Firebase Admin initialized');
    console.log('Storage Bucket:', process.env.FIREBASE_STORAGE_BUCKET);

    const bucket = admin.storage().bucket();
    console.log('Bucket name:', bucket.name);

    // Check if bucket exists
    const [exists] = await bucket.exists();
    console.log('Bucket exists:', exists);

    if (!exists) {
      console.log('❌ Bucket does not exist!');
      console.log('Trying alternate bucket name...');

      const altBucketName = bucket.name.includes('.firebasestorage.app')
        ? bucket.name.replace('.firebasestorage.app', '.appspot.com')
        : bucket.name.replace('.appspot.com', '.firebasestorage.app');

      const altBucket = admin.storage().bucket(altBucketName);
      const [altExists] = await altBucket.exists();

      console.log('Alternate bucket name:', altBucketName);
      console.log('Alternate bucket exists:', altExists);

      if (altExists) {
        console.log('✅ Use this bucket name in your .env.local:');
        console.log('FIREBASE_STORAGE_BUCKET=' + altBucketName);
      }
    } else {
      console.log('✅ Storage bucket is accessible!');

      // Try to list files
      const [files] = await bucket.getFiles({ maxResults: 1 });
      console.log('Can list files:', true);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testStorage();
