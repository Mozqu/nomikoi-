import admin from 'firebase-admin'
import { getApps } from 'firebase-admin/app'

console.log('Firebase Admin module loading...')

// 環境変数のチェック
if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
  console.error('Missing Firebase Admin environment variables')
}

// Firebase Admin SDKの初期化（まだ初期化されていない場合）
if (!getApps().length) {
  try {
    console.log('Initializing Firebase Admin...')
    
    // privateKeyの処理
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || ''
    
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID || '',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
        privateKey: privateKey,
      }),
    })
    console.log('Firebase Admin initialized successfully')
  } catch (error) {
    console.error('Firebase Admin initialization error:', error)
    if (error instanceof Error) {
      console.error('Error details:', error.message)
    }
  }
}

export default admin
