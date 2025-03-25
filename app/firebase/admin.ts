import { getApps, initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// ビルド時のデバッグログ
process.stdout.write('\n=== Firebase Admin Debug Info ===\n');
process.stdout.write(`FIREBASE_PROJECT_ID: ${process.env.FIREBASE_PROJECT_ID}\n`);
process.stdout.write(`FIREBASE_CLIENT_EMAIL: ${process.env.FIREBASE_CLIENT_EMAIL}\n`);
process.stdout.write(`FIREBASE_PRIVATE_KEY exists: ${!!process.env.FIREBASE_PRIVATE_KEY}\n`);

// サービスアカウントの設定を確認
const checkRequiredEnvVars = () => {
  const required = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
  };

  process.stdout.write('\nChecking required variables:\n');
  process.stdout.write(`projectId exists: ${!!required.projectId}\n`);
  process.stdout.write(`clientEmail exists: ${!!required.clientEmail}\n`);
  process.stdout.write(`privateKey exists: ${!!required.privateKey}\n`);

  const missing = Object.entries(required)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    const errorMsg = `Missing required Firebase Admin environment variables: ${missing.join(', ')}`;
    process.stdout.write(`\nError: ${errorMsg}\n`);
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
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n'),
    };

    process.stdout.write('\nService Account Config:\n');
    process.stdout.write(`projectId: ${serviceAccount.projectId}\n`);
    process.stdout.write(`clientEmail: ${serviceAccount.clientEmail}\n`);
    process.stdout.write(`privateKey length: ${serviceAccount.privateKey.length}\n`);

    initializeApp({
      credential: cert(serviceAccount),
    });
    
    process.stdout.write('Firebase Admin initialized successfully\n');
  } catch (error) {
    process.stdout.write(`\nFirebase Admin initialization error: ${error}\n`);
    throw error;
  }
}

export const adminAuth = getAuth();
export const adminDb = getFirestore();

// エクスポート関数の名前を修正
export const getFirebaseAdminAuth = () => getAuth();
export const getFirebaseAdminDb = () => getFirestore(); 