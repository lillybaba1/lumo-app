
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig } from './firebaseConfig';

// Lazy initialization to avoid server-side issues in Edge runtime
let _app: FirebaseApp | null = null;
let _db: Firestore | null = null;
let _storage: FirebaseStorage | null = null;
let _auth: Auth | null = null;

function initializeFirebase() {
  if (typeof window === 'undefined') {
    // Don't initialize on server-side
    return;
  }

  if (!_app) {
    _app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  }
  if (!_db) {
    _db = getFirestore(_app);
  }
  if (!_storage) {
    _storage = getStorage(_app);
  }
  if (!_auth) {
    _auth = getAuth(_app);
  }
}

// Getters that initialize on first access
export const getClientApp = (): FirebaseApp => {
  initializeFirebase();
  if (!_app) throw new Error('Firebase not available on server');
  return _app;
};

export const getClientDb = (): Firestore => {
  initializeFirebase();
  if (!_db) throw new Error('Firestore not available on server');
  return _db;
};

export const getClientStorage = (): FirebaseStorage => {
  initializeFirebase();
  if (!_storage) throw new Error('Storage not available on server');
  return _storage;
};

export const getClientAuth = (): Auth => {
  initializeFirebase();
  if (!_auth) throw new Error('Auth not available on server');
  return _auth;
};

// Legacy exports for backwards compatibility (will throw on server)
export const app = new Proxy({} as FirebaseApp, {
  get: () => getClientApp()
});

export const db = new Proxy({} as Firestore, {
  get: (target, prop) => {
    const firestore = getClientDb();
    return firestore[prop as keyof Firestore];
  }
});

export const storage = new Proxy({} as FirebaseStorage, {
  get: (target, prop) => {
    const fbStorage = getClientStorage();
    return fbStorage[prop as keyof FirebaseStorage];
  }
});

export const auth = new Proxy({} as Auth, {
  get: (target, prop) => {
    const fbAuth = getClientAuth();
    return fbAuth[prop as keyof Auth];
  }
});
