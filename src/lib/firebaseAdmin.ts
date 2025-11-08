import 'server-only';

/**
 * Node-only Firebase Admin initializer.
 * Supports three credential sources (in order):
 * - FIREBASE_SERVICE_ACCOUNT_JSON (raw JSON string)
 * - FIREBASE_SERVICE_ACCOUNT_BASE64 (base64-encoded JSON)
 * - GOOGLE_APPLICATION_CREDENTIALS (file path for ADC)
 *
 * This file intentionally refuses to initialize on Edge runtimes.
 */
import admin from 'firebase-admin';

declare global {
  // eslint-disable-next-line no-var
  var __FIREBASE_ADMIN_APP__: admin.app.App | undefined;
}

function readSvcFromEnv(): any | null {
  // Check both FIREBASE_ prefixed and non-prefixed versions for compatibility
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.SERVICE_ACCOUNT_JSON;
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 || process.env.SERVICE_ACCOUNT_BASE64;
  const path = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (json) {
    try {
      return JSON.parse(json);
    } catch (e) {
      throw new Error('SERVICE_ACCOUNT_JSON contains invalid JSON');
    }
  }
  if (b64) {
    try {
      const raw = Buffer.from(b64, 'base64').toString('utf8');
      return JSON.parse(raw);
    } catch (e) {
      throw new Error('SERVICE_ACCOUNT_BASE64 is not valid base64 JSON');
    }
  }
  if (path) return { __path: path };
  return null; // use ADC when available
}

function normalizeSvc(raw: any) {
  if ((raw as any).__path) return raw;
  let privateKey = raw.private_key ?? raw.privateKey;
  if (typeof privateKey === 'string' && privateKey.includes('\\n')) privateKey = privateKey.replace(/\\n/g, '\n');
  const projectId = raw.project_id ?? raw.projectId;
  const clientEmail = raw.client_email ?? raw.clientEmail;
  if (!projectId || !clientEmail || !privateKey) throw new Error('Bad service account JSON');
  return { projectId, clientEmail, privateKey };
}

export function getAdminApp(): admin.app.App {
  // Prevent admin SDK usage on Edge runtimes
  const isEdge = process.env.NEXT_RUNTIME === 'edge' || process.env.CF_PAGES === '1' || process.env.EDGE_RUNTIME === '1';
  if (isEdge) {
    throw new Error('Firebase Admin is not available on Edge runtimes. Run admin code in a Node server or serverless function.');
  }

  if (global.__FIREBASE_ADMIN_APP__) return global.__FIREBASE_ADMIN_APP__;

  const svc = readSvcFromEnv();

  if (svc && (svc as any).__path) {
    // GOOGLE_APPLICATION_CREDENTIALS is set; let the SDK use ADC
    if (!admin.apps.length) {
      admin.initializeApp();
    }
    global.__FIREBASE_ADMIN_APP__ = admin.app();
    return global.__FIREBASE_ADMIN_APP__;
  }

  if (svc) {
    const normalized = normalizeSvc(svc);
    const certObj = {
      projectId: normalized.projectId,
      clientEmail: normalized.clientEmail,
      privateKey: normalized.privateKey,
    };
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(certObj as admin.ServiceAccount),
        // optional: set storageBucket if needed
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.STORAGE_BUCKET || `${normalized.projectId}.appspot.com`,
      });
    }
    global.__FIREBASE_ADMIN_APP__ = admin.app();
    return global.__FIREBASE_ADMIN_APP__;
  }

  // No explicit credentials found - try using Application Default Credentials (ADC)
  // This works automatically when deployed to Firebase Hosting, Cloud Functions, or Cloud Run
  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.STORAGE_BUCKET,
      });
    }
    global.__FIREBASE_ADMIN_APP__ = admin.app();
    return global.__FIREBASE_ADMIN_APP__;
  } catch (error) {
    // If ADC initialization fails, throw helpful error for local development
    throw new Error(
      'Firebase Admin credentials not found. Please set one of the following environment variables:\n' +
      '  - SERVICE_ACCOUNT_JSON (recommended)\n' +
      '  - SERVICE_ACCOUNT_BASE64\n' +
      '  - GOOGLE_APPLICATION_CREDENTIALS\n\n' +
      'See FIREBASE_SETUP.md for detailed setup instructions.\n\n' +
      `Original error: ${error}`
    );
  }
}

export const adminAuth = () => getAdminApp().auth();
export const adminDb = () => getAdminApp().firestore();
export const adminStorage = () => getAdminApp().storage();
export const adminBucket = () => getAdminApp().storage().bucket();

export const authAdmin = adminAuth;
export const dbAdmin = adminDb;
export const bucket = adminBucket;

export const isFirebaseAdminInitialized = () => !!global.__FIREBASE_ADMIN_APP__;
