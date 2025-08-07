
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  "projectId": "lumo-d0hqd",
  "appId": "1:1068555679622:web:8cfd2105a457ba38d21e07",
  "storageBucket": "lumo-d0hqd.firebasestorage.app",
  "apiKey": "AIzaSyB4JQQy6rGJHRGtEWihXKrIoPFtHiBjrIA",
  "authDomain": "lumo-d0hqd.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "1068555679622"
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };
