import { getApps, initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// 即時実行される環境変数チェック
(() => {
  console.error('\n=== Firebase Admin Environment Variables ===');
  console.error('FIREBASE_PROJECT_ID:', typeof process.env.FIREBASE_PROJECT_ID, JSON.stringify(process.env.FIREBASE_PROJECT_ID));
  console.error('FIREBASE_CLIENT_EMAIL:', typeof process.env.FIREBASE_CLIENT_EMAIL, JSON.stringify(process.env.FIREBASE_CLIENT_EMAIL));
  console.error('FIREBASE_PRIVATE_KEY:', typeof process.env.FIREBASE_PRIVATE_KEY, process.env.FIREBASE_PRIVATE_KEY ? 'exists' : 'undefined');
  console.error('Environment:', process.env.NODE_ENV);
})();

// 環境変数の検証と正規化
const validateAndNormalizeEnvVars = () => {
  try {
    // 環境変数の存在チェック
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    console.error('\n=== Raw Environment Variables ===');
    console.error('FIREBASE_PROJECT_ID:', JSON.stringify(projectId));
    console.error('FIREBASE_CLIENT_EMAIL:', JSON.stringify(clientEmail));
    console.error('FIREBASE_PRIVATE_KEY exists:', !!privateKey);

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Missing required environment variables');
    }

    // 値の正規化と検証
    const normalized = {
      projectId: String(projectId).trim(),
      clientEmail: String(clientEmail).trim(),
      privateKey: privateKey.includes('\\n') 
        ? privateKey.replace(/\\n/g, '\n') 
        : privateKey
    };

    console.error('\n=== Normalized Values ===');
    console.error('projectId:', JSON.stringify(normalized.projectId));
    console.error('clientEmail:', JSON.stringify(normalized.clientEmail));
    console.error('privateKey format valid:', normalized.privateKey.includes('-----BEGIN PRIVATE KEY-----'));

    // 値の検証
    if (normalized.projectId.length === 0) {
      throw new Error('Project ID cannot be empty');
    }
    if (!normalized.clientEmail.includes('@')) {
      throw new Error('Invalid client email format');
    }
    if (!normalized.privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      throw new Error('Invalid private key format');
    }

    return normalized;
  } catch (error) {
    console.error('\nValidation Error:', error);
    throw error;
  }
};

// Firebase Adminの初期化
let app;
try {
  if (!getApps().length) {
    const credentials = validateAndNormalizeEnvVars();
    
    const serviceAccount: ServiceAccount = {
      projectId: credentials.projectId,
      clientEmail: credentials.clientEmail,
      privateKey: credentials.privateKey,
    };

    console.error('\n=== Final Service Account Config ===');
    console.error('projectId:', JSON.stringify(serviceAccount.projectId));
    console.error('clientEmail:', JSON.stringify(serviceAccount.clientEmail));
    console.error('privateKey valid:', serviceAccount.privateKey.includes('-----BEGIN PRIVATE KEY-----'));

    app = initializeApp({
      credential: cert(serviceAccount),
    });
    
    console.error('Firebase Admin initialized successfully');
  } else {
    app = getApps()[0];
    console.error('Using existing Firebase Admin instance');
  }
} catch (error) {
  console.error('\nFirebase Admin initialization error:', error);
  throw error;
}

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);

// エクスポート関数の名前を修正
export const getFirebaseAdminAuth = () => getAuth(app);
export const getFirebaseAdminDb = () => getFirestore(app); 