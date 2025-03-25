import { getApps, initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// 即時実行される環境変数チェック
(() => {
  console.error('\n=== Firebase Admin Environment Variables ===');
  console.error('FIREBASE_PROJECT_ID:', JSON.stringify(process.env.FIREBASE_PROJECT_ID));
  console.error('FIREBASE_CLIENT_EMAIL:', JSON.stringify(process.env.FIREBASE_CLIENT_EMAIL));
  console.error('FIREBASE_PRIVATE_KEY exists:', !!process.env.FIREBASE_PRIVATE_KEY);
})();

// サービスアカウントの設定を確認
const checkRequiredEnvVars = () => {
  const required = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
  };

  console.error('\nRequired variables values:');
  console.error('projectId:', JSON.stringify(required.projectId));
  console.error('clientEmail:', JSON.stringify(required.clientEmail));
  console.error('privateKey exists:', !!required.privateKey);

  const missing = Object.entries(required)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    const errorMsg = `Missing required Firebase Admin environment variables: ${missing.join(', ')}`;
    console.error('\nError:', errorMsg);
    throw new Error(errorMsg);
  }

  return required;
};

// Firebase Adminの初期化
if (!getApps().length) {
  try {
    const { projectId, clientEmail, privateKey } = checkRequiredEnvVars();

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Required environment variables are undefined');
    }

    const serviceAccount: ServiceAccount = {
      projectId: String(projectId),
      clientEmail: String(clientEmail),
      privateKey: String(privateKey).replace(/\\n/g, '\n'),
    };

    console.error('\nService Account Config:');
    console.error('projectId:', JSON.stringify(serviceAccount.projectId));
    console.error('clientEmail:', JSON.stringify(serviceAccount.clientEmail));
    console.error('privateKey length:', serviceAccount.privateKey.length);

    initializeApp({
      credential: cert(serviceAccount),
    });
    
    console.error('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('\nFirebase Admin initialization error:', error);
    throw error;
  }
}

export const adminAuth = getAuth();
export const adminDb = getFirestore();

// エクスポート関数の名前を修正
export const getFirebaseAdminAuth = () => getAuth();
export const getFirebaseAdminDb = () => getFirestore(); 