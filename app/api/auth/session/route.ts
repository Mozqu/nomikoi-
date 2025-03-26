import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth } from '@/app/firebase/admin';

export async function POST(request: Request) {
  console.log('=== セッション作成開始 ===');
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      console.error('IDトークンが提供されていません');
      return NextResponse.json(
        { error: 'IDトークンが必要です' },
        { status: 400 }
      );
    }

    // IDトークンを検証
    console.log('IDトークンを検証中...');
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    console.log('IDトークン検証成功:', { uid: decodedToken.uid });

    // セッションCookieを作成（有効期限: 2週間）
    const expiresIn = 60 * 60 * 24 * 14 * 1000; // 2週間（ミリ秒）
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    // レスポンスを作成
    const response = NextResponse.json({ status: 'success' });

    // Cookieを設定
    console.log('セッションCookieを設定中...');
    response.cookies.set({
      name: 'session',
      value: sessionCookie,
      maxAge: expiresIn / 1000, // 秒単位に変換
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });

    console.log('セッション作成成功');
    return response;

  } catch (error) {
    console.error('セッション作成エラー:', error);
    
    if (error instanceof Error) {
      // Firebase Auth特有のエラーをハンドリング
      if (error.message.includes('auth/invalid-id-token')) {
        return NextResponse.json(
          { error: '無効なIDトークンです' },
          { status: 401 }
        );
      }
      if (error.message.includes('auth/session-cookie-expired')) {
        return NextResponse.json(
          { error: 'セッションの有効期限が切れています' },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { error: 'セッションの作成に失敗しました' },
      { status: 500 }
    );
  }
} 