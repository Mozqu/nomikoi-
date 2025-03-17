// app/api/login/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import admin from 'firebase-admin'
import { getApps } from 'firebase-admin/app'

// デバッグ用のログ
console.log('API Route: Loading...')
console.log('Environment variables exist:', {
  projectId: !!process.env.FIREBASE_PROJECT_ID,
  clientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: !!process.env.FIREBASE_PRIVATE_KEY,
})

// Firebase Admin SDKの初期化（まだ初期化されていない場合）
if (!getApps().length) {
  try {
    console.log('Initializing Firebase Admin...')
    
    // 環境変数のチェック
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
      throw new Error('Missing Firebase Admin environment variables')
    }
    
    // privateKeyの処理
    const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
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

export async function POST(request: Request) {
  console.log('API Route: POST request received')
  
  try {
    // リクエストボディの解析
    let body
    try {
      body = await request.json()
      console.log('Request body received (idToken length):', body.idToken ? body.idToken.length : 'missing')
    } catch (e) {
      console.error('Failed to parse request body:', e)
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
    
    // idTokenの検証
    if (!body || !body.idToken) {
      console.error('Missing idToken in request')
      return NextResponse.json({ error: 'idToken is required' }, { status: 400 })
    }
    
    const { idToken } = body
    
    // セッションの有効期限（2週間）
    const expiresIn = 60 * 60 * 24 * 14 * 1000
    
    try {
      console.log('Verifying ID token...')
      
      // まずトークンを検証
      const decodedToken = await admin.auth().verifyIdToken(idToken)
      console.log('Token verified for user:', decodedToken.uid)
      
      // セッションクッキーを作成
      console.log('Creating session cookie...')
      const sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn })
      
      // クッキーを設定
      console.log('Setting session cookie...')
      cookies().set('session', sessionCookie, {
        maxAge: expiresIn / 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        sameSite: 'lax',
      })
      
      console.log('Session created successfully')
      return NextResponse.json({ success: true })
    } catch (firebaseError) {
      console.error('Firebase authentication error:', firebaseError)
      if (firebaseError instanceof Error) {
        console.error('Error details:', firebaseError.message)
      }
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
    }
  } catch (error) {
    console.error('Unexpected error in API route:', error)
    if (error instanceof Error) {
      console.error('Error details:', error.message)
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}