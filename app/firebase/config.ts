import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from "firebase/analytics";

// Import the functions you need from the SDKs you need
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBGZ602gpybqLGh4kgnkN8fQnR1CEJzKpY",
  authDomain: "nomikoi.firebaseapp.com",
  projectId: "nomikoi",
  storageBucket: "nomikoi.firebasestorage.app",
  messagingSenderId: "76587219288",
  appId: "1:76587219288:web:d8c45009b475619cedcd2d",
  measurementId: "G-F4SJ6WDG04"
};

// Firebaseの初期化を条件付きで行う
let app = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let analytics = null;
let storage = null;

if (typeof window !== 'undefined') {
  try {
    // クライアントサイドの場合のみ初期化
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    // analyticsはオプショナルに
    try {
      analytics = getAnalytics(app);
    } catch (error) {
      console.warn('Analytics initialization failed:', error);
      analytics = null;
    }
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
}

export { app, auth, db, analytics, storage }; 