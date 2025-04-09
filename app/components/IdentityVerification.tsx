import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface IdentityVerificationProps {
  userId: string;
}

export default function IdentityVerification({ userId }: IdentityVerificationProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleVerification = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/stripe/identity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const { clientSecret, url } = await response.json();

      if (url) {
        router.push(url);
      } else {
        const stripe = await stripePromise;
        if (!stripe) throw new Error('Stripeの読み込みに失敗しました');

        const { error } = await stripe.verifyIdentity(clientSecret);
        if (error) throw error;
      }
    } catch (error) {
      console.error('本人確認の開始に失敗:', error);
      alert('本人確認の開始に失敗しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <h2 className="text-xl font-bold mb-4">本人確認</h2>
      <p className="text-gray-600 mb-6 text-center">
        安全なコミュニティを維持するため、本人確認が必要です。
        <br />
        身分証明書と自撮り写真の提出をお願いします。
      </p>
      <Button
        onClick={handleVerification}
        disabled={loading}
        className="bg-neon text-white"
      >
        {loading ? '読み込み中...' : '本人確認を開始'}
      </Button>
    </div>
  );
} 