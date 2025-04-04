import { NextResponse } from 'next/server';
import { adminDb } from '@/app/firebase/admin';
import { cookies } from 'next/headers';
import { adminAuth } from '@/app/firebase/admin';

const COOKIE_NAME = 'session';

export async function POST(request: Request) {
  try {
    // セッションCookieから認証情報を取得
    const cookiesList = await cookies();
    const sessionCookie = cookiesList.get(COOKIE_NAME)?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // セッションCookieを検証
    const decodedClaims = await adminAuth.verifySessionCookie(
      sessionCookie,
      true
    );

    const { tags } = await request.json();

    // バリデーション
    if (!Array.isArray(tags)) {
      return NextResponse.json({ error: 'タグは配列である必要があります' }, { status: 400 });
    }

    if (tags.length > 20) {
      return NextResponse.json({ error: 'タグは20個までです' }, { status: 400 });
    }

    // ユーザードキュメントを更新
    await adminDb.collection('users').doc(decodedClaims.uid).update({
      'answers.drinking_tags': tags,
      updatedAt: new Date()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving drinking tags:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '保存に失敗しました' },
      { status: 500 }
    );
  }
} 