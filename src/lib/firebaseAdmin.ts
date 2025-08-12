
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getStorage, Bucket } from 'firebase-admin/storage';
import { firebaseConfig } from './firebaseConfig';

if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  console.warn("FIREBASE_SERVICE_ACCOUNT_JSON is not set. Firebase Admin SDK will not be initialized. Some features may not work as expected.");
}

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
  : {};

const appName = 'firebase-admin-app-lumo';

let adminApp: App | null = null;
if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  adminApp = getApps().find(app => app.name === appName) ?? initializeApp({
    credential: cert(serviceAccount),
    storageBucket: firebaseConfig.storageBucket,
  }, appName);
}

const dbAdmin: Firestore | null = adminApp ? getFirestore(adminApp) : null;
const authAdmin: Auth | null = adminApp ? getAuth(adminApp) : null;
const bucket: Bucket | null = adminApp ? getStorage(adminApp).bucket() : null;
const isFirebaseAdminInitialized = !!adminApp;

if (adminApp) {
    console.log("Firebase Admin SDK initialized successfully.");
}

export { adminApp, dbAdmin, authAdmin, bucket, isFirebaseAdminInitialized };
