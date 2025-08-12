import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAuth, Auth } from 'firebase/auth';

const firebaseConfig = {
  "projectId": "lumo-d0hqd",
  "appId": "1:1068555679622:web:8cfd2105a457ba38d21e07",
  "storageBucket": "lumo-d0hqd.appspot.com",
  "apiKey": "AIzaSyB4JQQy6rGJHRGtEWihXKrIoPFtHiBjrIA",
  "authDomain": "lumo-d0hqd.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "1068555679622"
};

// Initialize Firebase for the client
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);
const auth: Auth = getAuth(app);

export { app, db, storage, auth };
