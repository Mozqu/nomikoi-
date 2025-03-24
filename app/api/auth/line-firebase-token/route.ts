import { NextResponse } from 'next/server'
import { auth } from 'firebase-admin'
import { initializeApp, getApps, cert } from 'firebase-admin/app'

// Firebase Adminの初期化
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

export async function POST() {
  try {
    // LIFFからのIDトークンを検証
    const idToken = await liff.getIDToken()
    if (!idToken) {
      return NextResponse.json({ error: 'No ID token' }, { status: 401 })
    }

    // LINE UserIDを取得
    const decodedToken = await auth().verifyIdToken(idToken)
    const uid = decodedToken.uid

    // Firebaseカスタムトークンを生成
    const customToken = await auth().createCustomToken(uid)

    return NextResponse.json({ customToken })
  } catch (error) {
    console.error('Error creating custom token:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 