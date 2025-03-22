// app/api/login/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import admin from 'firebase-admin'
import { getApps, initializeApp, cert } from 'firebase-admin/app'

// デバッグ用のログ
console.log('API Route: Loading...')
console.log('Environment variables exist:', {
  projectId: !!process.env.FIREBASE_PROJECT_ID,
  clientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: !!process.env.FIREBASE_PRIVATE_KEY,
})

export const runtime = 'nodejs'; // Edge Runtimeを使用しないことを明示

export async function POST(request: Request) {
  console.log('Environment check at request time:', {
    NODE_ENV: process.env.NODE_ENV,
    FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY?.substring(0, 10) + '...',
  });

  if (!getApps().length) {
    try {
      console.log('Initializing Firebase in request...');
      const app = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    } catch (error) {
      console.error('Detailed initialization error:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }

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