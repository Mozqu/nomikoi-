import { NextResponse } from 'next/server';
import { stripe } from '@/app/lib/stripe';

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    const verificationSession = await stripe.identity.verificationSessions.create({
      type: 'document',
      metadata: {
        userId: userId,
      },
      options: {
        document: {
          require_id_number: true,
          require_matching_selfie: true,
        },
      },
    });

    return NextResponse.json({
      clientSecret: verificationSession.client_secret,
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