import 'server-only';

// import admin from 'firebase-admin';

// declare global { var __FIREBASE_ADMIN_APP__: admin.app.App | undefined; }
// import { firebaseConfig } from './firebaseConfig';
// function readSvcFromEnv(): any | null {
//   const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
//   const b64  = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
//   const path = process.env.GOOGLE_APPLICATION_CREDENTIALS;
//   if (json) return JSON.parse(json);
//   if (b64)  return JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
//   if (path) return { __path: path };
//   return null; // none -> use ADC on Firebase
// }

// function normalizeSvc(raw: any) {
//   if ((raw as any).__path) return raw;
//   let privateKey = raw.private_key ?? raw.privateKey;
//   if (typeof privateKey === 'string' && privateKey.includes('\n')) privateKey = privateKey.replace(/\\n/g, '\n');
//   const projectId   = raw.project_id   ?? raw.projectId;
//   const clientEmail = raw.client_email ?? raw.clientEmail;
//   if (!projectId || !clientEmail || !privateKey) throw new Error('Bad service account');
//   return { projectId, clientEmail, privateKey };
// }

export function getAdminApp() {
  throw new Error('Firebase Admin is not available on Cloudflare Edge runtime.');
}

export const adminAuth = () => getAdminApp();
export const adminDb = () => getAdminApp();
export const adminStorage = () => getAdminApp();
export const adminBucket = () => getAdminApp();

export const authAdmin = getAdminApp();
export const dbAdmin = getAdminApp();
export const bucket = getAdminApp();

export const isFirebaseAdminInitialized = () => false;
