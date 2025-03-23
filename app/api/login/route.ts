// app/api/login/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getFirebaseAuth } from '@/app/firebase/admin'

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
    console.log('ID Token received, length:', idToken.length)

    const auth = getFirebaseAuth()
    const decodedToken = await auth.verifyIdToken(idToken)
    console.log('Token verified for user:', decodedToken.uid)

    // セッションクッキーを作成（5日間）
    const expiresIn = 60 * 60 * 24 * 5 * 1000
    console.log('Creating session cookie...')
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn })

    // クッキーを設定
    console.log('Setting session cookie...')
    const cookieStore = await cookies()
    cookieStore.set('session', sessionCookie, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: "/",
      sameSite: 'lax'  // CSRF対策として追加
    })

    console.log('Session cookie set successfully')
    return new NextResponse(
      JSON.stringify({ 
        status: "success",
        redirect: '/home'  // リダイレクト先を指定
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error("Session creation error:", error)
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}