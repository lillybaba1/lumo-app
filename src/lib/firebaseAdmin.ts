
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getStorage, Storage, Bucket } from 'firebase-admin/storage';

let adminApp: App | null = null;
let dbAdmin: Firestore | null = null;
let authAdmin: Auth | null = null;
let storageAdmin: Storage | null = null;
let bucket: Bucket | null = null;
let isFirebaseAdminInitialized = false;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    
    // Use a unique app name to avoid conflicts
    const appName = 'firebase-admin-app-lumo';

    if (!getApps().some(app => app.name === appName)) {
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        storageBucket: `${serviceAccount.project_id}.appspot.com`
      }, appName);
    } else {
      adminApp = getApps().find(app => app.name === appName)!;
    }
    
    dbAdmin = getFirestore(adminApp);
    authAdmin = getAuth(adminApp);
    storageAdmin = getStorage(adminApp);
    bucket = storageAdmin.bucket();
    isFirebaseAdminInitialized = true;
    console.log("Firebase Admin SDK initialized successfully.");
  } else {
    console.warn("FIREBASE_SERVICE_ACCOUNT_JSON is not set. Firebase Admin SDK is not initialized. Using mock data.");
  }
} catch (error: any) {
  console.error("Firebase Admin SDK initialization failed:", error.message);
}

export { adminApp, dbAdmin, authAdmin, storageAdmin, bucket, isFirebaseAdminInitialized };
