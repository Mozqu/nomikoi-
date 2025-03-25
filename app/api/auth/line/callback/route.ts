import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/app/firebase/admin';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    
    console.error('[DEBUG] LINE Callback:', { code: !!code, state });

    if (!code) {
      throw new Error('Authorization code is missing');
    }

    // LINEトークンエンドポイントにリクエスト
    const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.NEXT_PUBLIC_LINE_CALLBACK_URL!,
        client_id: process.env.NEXT_PUBLIC_LINE_CHANNEL_ID!,
        client_secret: process.env.LINE_CHANNEL_SECRET!,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json();
      console.error('[ERROR] LINE Token Error:', error);
      throw new Error('Failed to get LINE token');
    }

    const { id_token, access_token } = await tokenResponse.json();

    // LINEプロフィールを取得
    const profileResponse = await fetch('https://api.line.me/v2/profile', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    });

    if (!profileResponse.ok) {
      throw new Error('Failed to get LINE profile');
    }

    const profile = await profileResponse.json();

    // Firebaseカスタムトークンを生成
    const customToken = await adminAuth.createCustomToken(profile.userId, {
      line: {
        userId: profile.userId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl,
      },
    });

    // セッションCookieを作成
    const idToken = await adminAuth.createSessionCookie(customToken, {
      expirationIn: 60 * 60 * 24 * 1000 // 24 hours
    });

    const response = NextResponse.redirect(
      new URL(isNewUser ? '/register/caution' : '/home', process.env.NEXT_PUBLIC_APP_URL!)
    );

    // セッションCookieを設定
    response.cookies.set('session', idToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24 hours
    });

    return response;
  } catch (error) {
    console.error('[ERROR] LINE Callback:', error);
    return NextResponse.redirect(
      new URL('/auth/error', process.env.NEXT_PUBLIC_APP_URL!)
    );
  }
} 