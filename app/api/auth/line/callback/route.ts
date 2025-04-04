import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/app/firebase/admin';
import { randomUUID } from 'crypto';

export async function GET(request: Request) {
  console.log('\n=== LINE Callback Start ===');
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    
    if (!code) {
      console.error('Authorization code is missing');
      throw new Error('Authorization code is missing');
    }

    console.log('Fetching LINE token...');
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
      const errorData = await tokenResponse.json();
      console.error('LINE token error:', errorData);
      throw new Error('Failed to get LINE token');
    }

    const { access_token } = await tokenResponse.json();
    console.log('LINE token fetched successfully');

    console.log('Fetching LINE profile...');
    // LINEプロフィールの取得
    const profileResponse = await fetch('https://api.line.me/v2/profile', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    });

    if (!profileResponse.ok) {
      const errorData = await profileResponse.json();
      console.error('LINE profile error:', errorData);
      throw new Error('Failed to get LINE profile');
    }

    const profile = await profileResponse.json();
    console.log('LINE profile fetched successfully');

    // lineIdで既存ユーザーを検索
    const existingUserQuery = await adminDb
      .collection('users')
      .where('lineId', '==', profile.userId)
      .get();

    let uid;
    if (!existingUserQuery.empty) {
      // 既存ユーザーの場合、そのUIDを使用
      uid = existingUserQuery.docs[0].id;
      console.log('Existing user found:', uid);
    } else {
      // 新規ユーザーの場合、新しいUIDを生成
      uid = randomUUID();
      console.log('Creating new user:', uid);
    }

    // カスタムトークンの生成
    const customToken = await adminAuth.createCustomToken(uid, {
      line: {
        lineId: profile.userId,
      },
    });

    // Firestoreにユーザー情報を保存
    await adminDb.collection('users').doc(uid).set({
      lineId: profile.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      provider: 'line',
      uid: uid
    }, { merge: true });

    console.log('Custom token created successfully');

    // 認証ページにリダイレクト（カスタムトークンを渡す）
    const authUrl = new URL('/auth/verify', process.env.NEXT_PUBLIC_APP_URL!);
    authUrl.searchParams.set('token', customToken);
    authUrl.searchParams.set('isNewUser', 'true');

    console.log('Redirecting to:', authUrl.toString().replace(customToken, '[REDACTED]'));
    return NextResponse.redirect(authUrl.toString());

  } catch (error: any) {
    console.error('[ERROR] Detailed callback error:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      env: {
        callbackUrl: process.env.NEXT_PUBLIC_LINE_CALLBACK_URL ? 'exists' : 'missing',
        channelId: process.env.NEXT_PUBLIC_LINE_CHANNEL_ID ? 'exists' : 'missing',
        channelSecret: process.env.LINE_CHANNEL_SECRET ? 'exists' : 'missing',
        appUrl: process.env.NEXT_PUBLIC_APP_URL ? 'exists' : 'missing',
      }
    });

    const errorUrl = new URL('/auth/error', process.env.NEXT_PUBLIC_APP_URL!);
    errorUrl.searchParams.set('error', 'line_auth_failed');
    errorUrl.searchParams.set('message', error.message);
    return NextResponse.redirect(errorUrl.toString());
  }
} 