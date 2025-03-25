import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const EXPECTED_PROJECT_ID = 'nomikoi';

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
    console.error('FIREBASE_PRIVATE_KEY type:', typeof privateKey);

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

    console.error('\n=== Normalized Values ===');
    console.error('project_id:', JSON.stringify(normalized.project_id));
    console.error('project_id matches expected:', normalized.project_id === EXPECTED_PROJECT_ID);
    console.error('client_email:', JSON.stringify(normalized.client_email));
    console.error('private_key starts with:', normalized.private_key.substring(0, 20));
    console.error('private_key ends with:', normalized.private_key.slice(-20));

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
    console.error('\nValidation Error:', error);
    throw error;
  }
};

// Firebase Adminの初期化
let app;
try {
  if (!getApps().length) {
    const credentials = validateAndNormalizeEnvVars();

    // 明示的な型アサーション
    const serviceAccount = {
      type: 'service_account',
      project_id: credentials.project_id,
      client_email: credentials.client_email,
      private_key: credentials.private_key,
    };

    console.error('\n=== Final Service Account Config ===');
    console.error('type:', serviceAccount.type);
    console.error('project_id:', JSON.stringify(serviceAccount.project_id));
    console.error('project_id correct:', serviceAccount.project_id === EXPECTED_PROJECT_ID);
    console.error('client_email:', JSON.stringify(serviceAccount.client_email));
    console.error('private_key valid:', 
      serviceAccount.private_key.includes('-----BEGIN PRIVATE KEY-----') && 
      serviceAccount.private_key.includes('-----END PRIVATE KEY-----')
    );

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

export const getFirebaseAdminAuth = () => getAuth(app);
export const getFirebaseAdminDb = () => getFirestore(app); 