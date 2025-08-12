import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAuth, Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBb2rTZAGNbKDcF6lBxxCubKlxmks1n0ng",
  authDomain: "lumo-app-183f5.firebaseapp.com",
  projectId: "lumo-app-183f5",
  storageBucket: "lumo-app-183f5.appspot.com",
  messagingSenderId: "599053873389",
  appId: "1:599053873389:web:7ae9fc52e26be1e3d89ce4",
  measurementId: "G-EHRCCLS6CV"
};

// Initialize Firebase for the client
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);
const auth: Auth = getAuth(app);

export { app, db, storage, auth };
