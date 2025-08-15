
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getStorage, Bucket } from 'firebase-admin/storage';
import { firebaseConfig } from './firebaseConfig';

if (!process.env.SERVICE_ACCOUNT_JSON) {
  throw new Error("SERVICE_ACCOUNT_JSON is not set. Firebase Admin SDK cannot be initialized.");
}

const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_JSON);

const appName = 'firebase-admin-app-lumo';

let adminApp: App;

if (getApps().some(app => app.name === appName)) {
  adminApp = getApps().find(app => app.name === appName)!;
} else {
  adminApp = initializeApp({
    credential: cert(serviceAccount),
    storageBucket: firebaseConfig.storageBucket,
  }, appName);
  console.log("Firebase Admin SDK initialized successfully.");
}

const dbAdmin: Firestore = getFirestore(adminApp);
const authAdmin: Auth = getAuth(adminApp);
const bucket: Bucket = getStorage(adminApp).bucket();
const isFirebaseAdminInitialized = true;

export { adminApp, dbAdmin, authAdmin, bucket, isFirebaseAdminInitialized };
