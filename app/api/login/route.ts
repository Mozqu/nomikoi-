// app/api/login/route.ts
import { NextResponse } from 'next/server'
import { adminAuth } from '@/app/firebase/admin'

// デバッグ用のログ
console.log('API Route: Loading...')
console.log('Environment variables exist:', {
  projectId: !!process.env.FIREBASE_PROJECT_ID,
  clientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: !!process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
})

export const runtime = 'nodejs'; // Edge Runtimeを使用しないことを明示

const COOKIE_NAME = "session"

export async function POST(request: Request) {
  console.log('\n=== Login API Start ===')
  try {
    const { idToken } = await request.json()
    
    if (!idToken) {
      return NextResponse.json({ error: 'ID token is required' }, { status: 400 })
    }

    // IDトークンを検証
    const decodedToken = await adminAuth.verifyIdToken(idToken)

    // セッションCookieを作成（有効期限24時間）
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: 60 * 60 * 24 * 1000 // 24 hours
    })

    return NextResponse.json(
      { status: 'success' },
      {
        status: 200,
        headers: {
          'Set-Cookie': `session=${sessionCookie}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${60 * 60 * 24}`
        }
      }
    )
  } catch (error) {
    console.error('Session creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 401 }
    )
  }
}