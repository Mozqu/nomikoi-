import { NextResponse } from 'next/server';
import { stripe } from '@/app/lib/stripe';

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'ユーザーIDが必要です' },
        { status: 400 }
      );
    }

    const verificationSession = await stripe.identity.verificationSessions.create({
      type: 'document',
      metadata: {
        userId: userId,
      },
      options: {
        document: {
          require_id_number: true,
          require_matching_selfie: true,
          require_live_capture: true,
        },
      },
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/messages`,
    });

    return NextResponse.json({
      url: verificationSession.url,
    });
  } catch (error) {
    console.error('本人確認セッションの作成に失敗:', error);
    return NextResponse.json(
      { error: '本人確認セッションの作成に失敗しました' },
      { status: 500 }
    );
  }
} 