'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { auth } from '@/app/firebase/config';

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
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

      } catch (error) {
        console.error('Verification error:', error);
        router.push('/auth/error?error=verification_failed');
      }
    };

    verifyToken();
  }, [router, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">認証中...</h1>
        <p>しばらくお待ちください</p>
      </div>
    </div>
  );
} 