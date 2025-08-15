import 'server-only';
import admin from 'firebase-admin';

declare global { var __FIREBASE_ADMIN_APP__: admin.app.App | undefined; }
import { firebaseConfig } from './firebaseConfig';
function readSvcFromEnv(): any | null {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const b64  = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  const path = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (json) return JSON.parse(json);
  if (b64)  return JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
  if (path) return { __path: path };
  return null; // none -> use ADC on Firebase
}

function normalizeSvc(raw: any) {
  if ((raw as any).__path) return raw;
  let privateKey = raw.private_key ?? raw.privateKey;
  if (typeof privateKey === 'string' && privateKey.includes('\\n')) privateKey = privateKey.replace(/\\n/g, '\n');
  const projectId   = raw.project_id   ?? raw.projectId;
  const clientEmail = raw.client_email ?? raw.clientEmail;
  if (!projectId || !clientEmail || !privateKey) throw new Error('Bad service account');
  return { projectId, clientEmail, privateKey };
}

export function getAdminApp(): admin.app.App {
  if (!global.__FIREBASE_ADMIN_APP__) {
    const svc = readSvcFromEnv();
    const storageBucket = firebaseConfig.storageBucket ||
      process.env.STORAGE_BUCKET || undefined;

    const options: admin.AppOptions = storageBucket ? { storageBucket } : {};

    global.__FIREBASE_ADMIN_APP__ =
      svc
        ? admin.initializeApp({
            credential: (svc as any).__path
              ? admin.credential.cert((svc as any).__path)
              : admin.credential.cert(normalizeSvc(svc)),
            ...options,
          })
        : admin.initializeApp(options); // ADC on Firebase
  }
  return global.__FIREBASE_ADMIN_APP__;
}

export const adminAuth    = () => getAdminApp().auth();
export const adminDb      = () => getAdminApp().firestore();
export const adminStorage = () => getAdminApp().storage();
export const adminBucket  = () => {
  const name =
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    process.env.STORAGE_BUCKET;
  return name ? adminStorage().bucket(name) : adminStorage().bucket(); // falls back to default if set in options
};

// instances (if your code imports these directly)
export const authAdmin = adminAuth();
export const dbAdmin   = adminDb();
export const bucket    = adminBucket();

export const isFirebaseAdminInitialized = () => Boolean(global.__FIREBASE_ADMIN_APP__);
