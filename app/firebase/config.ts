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
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Firebaseの初期化を条件付きで行う
let app = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let analytics = null;
let storage = null;

if (typeof window !== 'undefined') {
  try {
    console.log('Initializing Firebase client...');
    // 既存のアプリがあればそれを使用、なければ新規作成
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    
    // 各サービスの初期化
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    
    // analyticsはオプショナルに
    if (process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID) {
      try {
        analytics = getAnalytics(app);
      } catch (error) {
        console.warn('Analytics initialization failed:', error);
      }
    }
    
    console.log('Firebase client initialized successfully');
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
}

export { app, auth, db, analytics, storage }; 