
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  "projectId": "lumo-d0hqd",
  "appId": "1:1068555679622:web:8cfd2105a457ba38d21e07",
  "storageBucket": "lumo-d0hqd.appspot.com",
  "apiKey": "AIzaSyB4JQQy6rGJHRGtEWihXKrIoPFtHiBjrIA",
  "authDomain": "lumo-d0hqd.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "1068555679622"
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

export { app, db, storage, auth };
