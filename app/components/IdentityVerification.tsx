'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { loadStripe } from '@stripe/stripe-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface IdentityVerificationProps {
  userId: string;
  isVerified?: boolean;
  verificationStatus?: string;
}

export default function IdentityVerification({ 
  userId, 
  isVerified = false,
  verificationStatus = '' 
}: IdentityVerificationProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleVerification = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/create-verification-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error('本人確認セッションの作成に失敗しました');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (err) {
      console.error('本人確認エラー:', err);
      setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const getStatusDisplay = () => {
    switch (verificationStatus) {
      case 'verified':
        return {
          icon: <CheckCircle2 className="w-6 h-6 text-green-500" />,
          text: '本人確認が完了しています',
          color: 'text-green-500'
        };
      case 'processing':
        return {
          icon: <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />,
          text: '本人確認を処理中です',
          color: 'text-blue-500'
        };
      case 'requires_input':
        return {
          icon: <AlertCircle className="w-6 h-6 text-yellow-500" />,
          text: '追加の情報が必要です',
          color: 'text-yellow-500'
        };
      default:
        return {
          icon: null,
          text: '',
          color: ''
        };
    }
  };

  const status = getStatusDisplay();

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg mb-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-6 h-6 text-red-500" />
          <p className="text-red-700">{error}</p>
        </div>
        <Button 
          onClick={() => setError(null)} 
          variant="outline" 
          className="mt-2"
        >
          再試行
        </Button>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-bold">本人確認</CardTitle>
        <CardDescription>
          安全なコミュニティを維持するため、本人確認が必要です。
          身分証明書と自撮り写真の提出をお願いします。
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status.text && (
          <div className="flex items-center gap-2 mb-4">
            {status.icon}
            <span className={status.color}>{status.text}</span>
          </div>
        )}
        {!isVerified && verificationStatus !== 'processing' && (
          <Button
            onClick={handleVerification}
            disabled={loading}
            className="w-full bg-neon text-white"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                処理中...
              </>
            ) : (
              '本人確認を開始'
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
} 