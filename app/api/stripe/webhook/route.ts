import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/app/lib/stripe';
import { db } from '@/app/firebase/config';
import { doc, updateDoc } from 'firebase/firestore';

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'Missing stripe-signature or webhook secret' },
      { status: 400 }
    );
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (event.type === 'identity.verification_session.verified') {
      const session = event.data.object;
      const userId = session.metadata.userId;

      if (userId && db) {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          isIdentityVerified: true,
          identityVerifiedAt: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}; 