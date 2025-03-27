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

// 環境変数のデバッグ出力
/*
console.log('=== Firebase環境変数の検証 ===');
console.log('API_KEY:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '設定済み' : '未設定');
console.log('AUTH_DOMAIN:', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? '設定済み' : '未設定');
console.log('PROJECT_ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '設定済み' : '未設定');
console.log('実際の設定値:', {
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId
});
*/

// Firebaseの初期化を条件付きで行う
let app = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let analytics = null;
let storage = null;

if (typeof window !== 'undefined') {
  try {
    console.log('Firebase設定の検証:', {
      hasApiKey: !!firebaseConfig.apiKey,
      hasAuthDomain: !!firebaseConfig.authDomain,
      hasProjectId: !!firebaseConfig.projectId,
      configProjectId: firebaseConfig.projectId,
      environment: process.env.NODE_ENV,
      windowLocation: window.location.href
    });

    if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
      throw new Error('必要なFirebase設定が不足しています');
    }

    const existingApps = getApps();
    if (existingApps.length) {
      console.log('既存のFirebaseアプリを使用します');
      app = getApp();
    } else {
      console.log('新規Firebaseアプリを初期化します');
      app = initializeApp(firebaseConfig);
    }

    // 認証の初期化
    console.log('Firebase認証を初期化中...');
    auth = getAuth(app);
    if (auth) {
      console.log('Firebase認証の初期化成功:', {
        currentUser: auth.currentUser ? {
          uid: auth.currentUser.uid,
          email: auth.currentUser.email
        } : null,
        authInstance: !!auth
      });
    }

    // Firestoreの初期化
    console.log('Firestoreを初期化中...');
    db = getFirestore(app);
    if (db) {
      console.log('Firestore初期化成功');
    }

    // Storageの初期化
    console.log('Firebase Storageを初期化中...');
    storage = getStorage(app);
    if (storage) {
      console.log('Storage初期化成功');
    }

    // Analyticsの初期化（オプション）
    if (process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID) {
      try {
        console.log('Analyticsを初期化中...');
        analytics = getAnalytics(app);
        console.log('Analytics初期化成功');
      } catch (error) {
        console.warn('Analytics初期化エラー:', error);
      }
    }

    console.log('Firebase初期化完了');
  } catch (error) {
    console.error('Firebase初期化エラー:', {
      error,
      message: error instanceof Error ? error.message : '不明なエラー',
      stack: error instanceof Error ? error.stack : undefined,
      config: {
        hasApiKey: !!firebaseConfig.apiKey,
        hasAuthDomain: !!firebaseConfig.authDomain,
        hasProjectId: !!firebaseConfig.projectId
      }
    });
    
    // 重要なエラーの場合は、グローバルエラーハンドラーに通知
    if (window.onerror) {
      window.onerror('Firebase初期化エラー', undefined, undefined, undefined, error as Error);
    }
  }
}

export { app, auth, db, analytics, storage }; 