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

export const runtime = 'nodejs'

// 許可するHTTPメソッドを明示的に指定
export const dynamic = 'force-dynamic'
export const allowedMethods = ['POST']

const COOKIE_NAME = "session"
const SESSION_EXPIRES_IN = 60 * 60 * 24 * 1000; // 24 hours in milliseconds

// POSTメソッドのみを受け付けるように修正
export async function POST(request: Request) {
  console.log('\n=== Login API Start ===')
  
  // メソッドの検証
  if (request.method !== 'POST') {
    return NextResponse.json(
      { error: 'Method not allowed' },
      { status: 405 }
    )
  }

  try {
    const { idToken } = await request.json()
    
    if (!idToken) {
      console.error('No ID token provided');
      return NextResponse.json({ error: 'ID token is required' }, { status: 400 })
    }

    console.log('Verifying ID token...');
    // IDトークンを検証
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    console.log('ID token verified successfully for user:', decodedToken.uid);

    console.log('Creating session cookie...');
    // セッションCookieを作成（有効期限24時間）
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_EXPIRES_IN
    })

    if (!sessionCookie) {
      console.error('Failed to create session cookie');
      throw new Error('Session cookie creation failed');
    }

    console.log('Session cookie created successfully');

    const cookieOptions = [
      `${COOKIE_NAME}=${sessionCookie}`,
      'Path=/',
      'HttpOnly',
      'Secure',
      'SameSite=Strict',
      `Max-Age=${SESSION_EXPIRES_IN / 1000}` // Convert to seconds
    ].join('; ');

    console.log('Setting cookie with options:', cookieOptions.replace(sessionCookie, '[REDACTED]'));

    return NextResponse.json(
      { 
        status: 'success',
        uid: decodedToken.uid 
      },
      {
        status: 200,
        headers: {
          'Set-Cookie': cookieOptions
        }
      }
    )
  } catch (error: any) {
    console.error('Session creation error:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });

    // より詳細なエラーメッセージを返す
    const errorMessage = error.code === 'auth/invalid-id-token' 
      ? 'Invalid or expired ID token'
      : 'Failed to create session';

    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 401 }
    )
  }
}

// OPTIONSメソッドを追加してCORSプリフライトリクエストに対応
export async function OPTIONS(request: Request) {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Allow': 'POST, OPTIONS',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}