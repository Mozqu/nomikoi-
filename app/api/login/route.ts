// app/api/login/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getFirebaseAuth } from '@/app/firebase/admin'

// デバッグ用のログ
console.log('API Route: Loading...')
console.log('Environment variables exist:', {
  projectId: !!process.env.FIREBASE_PROJECT_ID,
  clientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: !!process.env.FIREBASE_PRIVATE_KEY,
})

export const runtime = 'nodejs'; // Edge Runtimeを使用しないことを明示

export async function POST(request: Request) {
  console.log('API Route: POST request received')
  
  try {
    const body = await request.json()
    console.log('Request body received (idToken length):', body.idToken ? body.idToken.length : 'missing')

    if (!body || !body.idToken) {
      console.error('Missing idToken in request')
      return NextResponse.json({ error: 'idToken is required' }, { status: 400 })
    }
    
    const { idToken } = body
    const auth = getFirebaseAuth()
    
    // セッションの有効期限（2週間）
    const expiresIn = 60 * 60 * 24 * 14 * 1000
    
    try {
      console.log('Verifying ID token...')
      
      // まずトークンを検証
      const decodedToken = await auth.verifyIdToken(idToken)
      console.log('Token verified for user:', decodedToken.uid)
      
      // セッションクッキーを作成
      console.log('Creating session cookie...')
      const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn })
      
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
    } catch (error) {
      console.error('Firebase authentication error:', error)
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