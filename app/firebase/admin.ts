import { getApps, initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const EXPECTED_PROJECT_ID = 'nomikoi';

// 即時実行される環境変数チェック

// 環境変数の検証と正規化
const validateAndNormalizeEnvVars = () => {
  try {
    // 環境変数の存在チェック
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Missing required environment variables');
    }

    // 値の正規化と検証
    const normalized = {
      project_id: String(projectId).trim(),
      client_email: String(clientEmail).trim(),
      private_key: privateKey.includes('\\n') 
        ? privateKey.replace(/\\n/g, '\n') 
        : privateKey
    };

    // 値の検証
    if (normalized.project_id !== EXPECTED_PROJECT_ID) {
      throw new Error(`Project ID mismatch. Expected: ${EXPECTED_PROJECT_ID}, Got: ${normalized.project_id}`);
    }
    if (!normalized.client_email.endsWith(`@${normalized.project_id}.iam.gserviceaccount.com`)) {
      throw new Error('Invalid client email format for service account');
    }
    if (!normalized.private_key.includes('-----BEGIN PRIVATE KEY-----')) {
      throw new Error('Invalid private key format: Missing BEGIN marker');
    }
    if (!normalized.private_key.includes('-----END PRIVATE KEY-----')) {
      throw new Error('Invalid private key format: Missing END marker');
    }

    return normalized;
  } catch (error) {
    console.error('Firebase Admin validation error:', error);
    throw error;
  }
};

// Firebase Adminの初期化
let app;
try {
  if (!getApps().length) {
    const credentials = validateAndNormalizeEnvVars();

    const serviceAccount = {
      type: 'service_account',
      project_id: credentials.project_id,
      client_email: credentials.client_email,
      private_key: credentials.private_key,
    };

    app = initializeApp({
      credential: cert(serviceAccount as ServiceAccount),
    });
    
    console.log('Firebase Admin initialized successfully');
  } else {
    app = getApps()[0];
    console.log('Using existing Firebase Admin instance');
  }
} catch (error) {
  console.error('Firebase Admin initialization error:', error);
  throw error;
}

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);

export const getFirebaseAdminAuth = () => getAuth(app);
export const getFirebaseAdminDb = () => getFirestore(app); 