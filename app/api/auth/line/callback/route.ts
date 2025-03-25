import { NextResponse } from 'next/server';
import { adminAuth } from '@/app/firebase/admin';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    
    if (!code) {
      throw new Error('Authorization code is missing');
    }

    // LINEトークンの取得
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
      throw new Error('Failed to get LINE token');
    }

    const { access_token } = await tokenResponse.json();

    // LINEプロフィールの取得
    const profileResponse = await fetch('https://api.line.me/v2/profile', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    });

    if (!profileResponse.ok) {
      throw new Error('Failed to get LINE profile');
    }

    const profile = await profileResponse.json();

    // カスタムトークンの生成
    const customToken = await adminAuth.createCustomToken(profile.userId, {
      line: {
        userId: profile.userId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl,
      },
    });

    // 認証ページにリダイレクト（カスタムトークンを渡す）
    const authUrl = new URL('/auth/verify', process.env.NEXT_PUBLIC_APP_URL!);
    authUrl.searchParams.set('token', customToken);
    authUrl.searchParams.set('isNewUser', 'true'); // 新規ユーザー判定は後で実装

    return NextResponse.redirect(authUrl.toString());

  } catch (error) {
    console.error('[ERROR] Detailed callback error:', error);
    const errorUrl = new URL('/auth/error', process.env.NEXT_PUBLIC_APP_URL!);
    errorUrl.searchParams.set('error', 'Authentication failed');
    return NextResponse.redirect(errorUrl.toString());
  }
} 