'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { auth } from '@/app/firebase/config';
import { Spinner } from '@/app/components/Spinner';

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const verifyToken = async () => {
      try {
        const token = searchParams.get('token');
        const isNewUser = searchParams.get('isNewUser') === 'true';
        
        if (!token) {
          throw new Error('No token provided');
        }

        if (!auth) {
          throw new Error('Firebase authentication is not initialized');
        }

        // カスタムトークンでサインイン
        await signInWithCustomToken(auth, token);

        // IDトークンを取得してセッションを作成
        const idToken = await auth.currentUser?.getIdToken();
        
        if (!idToken) {
          throw new Error('Failed to get ID token');
        }

        // セッションの作成
        const response = await fetch('/api/auth/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ idToken }),
        });

        if (!response.ok) {
          throw new Error('Failed to create session');
        }

        // 適切なページにリダイレクト
        router.push(isNewUser ? '/register/caution' : '/home');

      } catch (error: any) {
        console.error('Verification error:', error);
        // ネットワークエラーの検出
        if (error.message?.includes('ERR_BLOCKED_BY_CLIENT') || 
            error.code === 'messaging/failed-service-worker-registration' ||
            error.message?.includes('Failed to register a ServiceWorker')) {
          setError('広告ブロッカーが有効になっているため、認証に失敗しました。このサイトの広告ブロッカーを無効にしてから、再度お試しください。');
        } else {
          router.push('/auth/error?error=verification_failed');
        }
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, [router, searchParams]);

  if (isLoading) {
    return <Spinner />;
  }

  return error ? (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4 text-red-600">エラーが発生しました</h1>
        <p className="mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          再試行
        </button>
      </div>
    </div>
  ) : null;
} 