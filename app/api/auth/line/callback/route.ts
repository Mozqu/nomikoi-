import { NextResponse } from 'next/server';
import { adminAuth } from '@/app/firebase/admin';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { initializeApp } from 'firebase/app';

// Firebaseクライアント設定
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    // デバッグログを追加
    console.error('[DEBUG] Callback URL:', url.toString());
    console.error('[DEBUG] Search Params:', Object.fromEntries(url.searchParams));
    
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    
    // LINE認証のレスポンスをデバッグ
    console.error('[DEBUG] LINE Auth Response:', {
      code: code ? 'exists' : 'missing',
      state,
      url: url.toString()
    });

    if (!code) {
      console.error('[ERROR] No code provided in callback');
      throw new Error('Authorization code is missing');
    }

    // LINEトークンリクエストのデバッグ
    console.error('[DEBUG] LINE Token Request:', {
      redirect_uri: process.env.NEXT_PUBLIC_LINE_CALLBACK_URL,
      client_id: process.env.NEXT_PUBLIC_LINE_CHANNEL_ID,
      client_secret: process.env.LINE_CHANNEL_SECRET ? 'exists' : 'missing'
    });

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

    const { access_token } = await tokenResponse.json();

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

    // カスタムトークンの生成
    const customToken = await adminAuth.createCustomToken(profile.userId, {
      line: {
        userId: profile.userId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl,
      },
    });

    // Firebaseクライアントの初期化
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);

    // カスタムトークンでサインイン
    const userCredential = await signInWithCustomToken(auth, customToken);
    
    // IDトークンの取得
    const idToken = await userCredential.user.getIdToken();

    // セッションCookieの作成
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: 60 * 60 * 24 * 1000 // 24 hours
    });

    // 新規ユーザーかどうかの確認
    let isNewUser = true;
    try {
      await adminAuth.getUserByEmail(profile.email);
      isNewUser = false;
    } catch {
      isNewUser = true;
    }

    const response = NextResponse.redirect(
      new URL(isNewUser ? '/register/caution' : '/home', process.env.NEXT_PUBLIC_APP_URL!)
    );

    // セッションCookieの設定
    response.cookies.set('session', sessionCookie, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24 hours in seconds
    });

    return response;
  } catch (error) {
    console.error('[ERROR] Detailed callback error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    // エラーページへリダイレクト
    const errorUrl = new URL('/auth/error', process.env.NEXT_PUBLIC_APP_URL!);
    errorUrl.searchParams.set('error', 'Authentication failed');
    return NextResponse.redirect(errorUrl.toString());
  }
} 