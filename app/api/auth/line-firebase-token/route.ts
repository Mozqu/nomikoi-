import { NextResponse } from 'next/server'
import { adminAuth } from '@/app/firebase/admin'

// デバッグ用のログ
console.error('[DEBUG] Firebase Admin Env Check:', {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKeyFirstLine: process.env.FIREBASE_PRIVATE_KEY?.split('\n')[0]
});

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: 'ID token is required' }, { status: 400 });
    }

    // IDトークンを検証
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    // カスタムトークンを生成
    const customToken = await adminAuth.createCustomToken(decodedToken.uid);

    return NextResponse.json({ customToken });
  } catch (error) {
    console.error('Firebase token error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Token generation failed' },
      { status: 500 }
    );
  }
} 