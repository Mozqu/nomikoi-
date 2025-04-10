import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/app/lib/stripe';
import { db } from '@/app/firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import Stripe from 'stripe';

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

    // Identity関連のイベントを処理
    if (event.type.startsWith('identity.verification_session.')) {
      const session = event.data.object as Stripe.Identity.VerificationSession;
      const userId = session.metadata?.userId;

      if (!userId || !db) {
        console.error('Missing userId or db connection');
        return NextResponse.json({ error: 'Invalid session data' }, { status: 400 });
      }

      const userRef = doc(db as any, 'users', userId);

      switch (event.type) {
        case 'identity.verification_session.verified':
          await updateDoc(userRef, {
            isIdentityVerified: true,
            identityVerifiedAt: new Date().toISOString(),
            verificationStatus: 'verified'
          });
          break;

        case 'identity.verification_session.processing':
          await updateDoc(userRef, {
            verificationStatus: 'processing'
          });
          break;

        case 'identity.verification_session.requires_input':
          await updateDoc(userRef, {
            verificationStatus: 'requires_input'
          });
          break;

        case 'identity.verification_session.canceled':
          await updateDoc(userRef, {
            verificationStatus: 'canceled'
          });
          break;

        case 'identity.verification_session.created':
          await updateDoc(userRef, {
            verificationStatus: 'created'
          });
          break;

        case 'identity.verification_session.redacted':
          await updateDoc(userRef, {
            verificationStatus: 'redacted'
          });
          break;

        default:
          console.log(`Unhandled identity event type: ${event.type}`);
      }

      console.log(`Successfully processed ${event.type} for user ${userId}`);
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