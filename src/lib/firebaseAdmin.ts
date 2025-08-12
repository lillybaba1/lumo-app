import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getStorage, Storage } from 'firebase-admin/storage';

// Ensure the environment variable is loaded
if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    throw new Error('The FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set.');
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

const adminApp: App = getApps().length > 0 ? getApps()[0]! : initializeApp({
  credential: cert(serviceAccount),
  storageBucket: 'lumo-d0hqd.appspot.com'
});

const dbAdmin: Firestore = getFirestore(adminApp);
const authAdmin: Auth = getAuth(adminApp);
const storageAdmin: Storage = getStorage(adminApp);


export { adminApp, dbAdmin, authAdmin, storageAdmin };
