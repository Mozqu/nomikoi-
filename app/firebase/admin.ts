import { getApps, initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// サービスアカウントの設定を確認
const checkRequiredEnvVars = () => {
  const required = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
  };

  const missing = Object.entries(required)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing required Firebase Admin environment variables: ${missing.join(', ')}`);
  }

  return required;
};

// Firebase Adminの初期化
if (!getApps().length) {
  try {
    const { projectId, clientEmail, privateKey } = checkRequiredEnvVars();

    const serviceAccount: ServiceAccount = {
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n'),
    };

    initializeApp({
      credential: cert(serviceAccount),
    });
    
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    throw error;
  }
}

export const adminAuth = getAuth();
export const adminDb = getFirestore();

// エクスポート関数の名前を修正
export const getFirebaseAdminAuth = () => getAuth();
export const getFirebaseAdminDb = () => getFirestore(); 