import { NextResponse } from 'next/server';
import { adminAuth } from '@/app/firebase/admin';

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

    // フロントエンドにリダイレクト
    const redirectUrl = new URL('/auth/line/complete', process.env.NEXT_PUBLIC_APP_URL!);
    redirectUrl.searchParams.set('token', customToken);
    
    return NextResponse.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('[ERROR] LINE Callback:', error);
    
    // エラー画面にリダイレクト
    const errorUrl = new URL('/auth/error', process.env.NEXT_PUBLIC_APP_URL!);
    errorUrl.searchParams.set('error', error instanceof Error ? error.message : 'Authentication failed');
    
    return NextResponse.redirect(errorUrl.toString());
  }
} 