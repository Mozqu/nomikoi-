'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAuth, signInWithCustomToken, AuthError } from 'firebase/auth';
import { auth } from '@/app/firebase/config';
import { Spinner } from '@/app/components/Spinner';

const getErrorMessage = (error: any) => {
  console.error('Authentication error details:', {
    code: error.code,
    message: error.message,
    name: error.name
  });

  if (error.code === 'auth/invalid-credential') {
    return '認証情報が無効です。再度ログインしてください。';
  }
  if (error.code === 'auth/invalid-custom-token') {
    return '認証トークンが無効です。再度ログインしてください。';
  }
  if (error.code === 'auth/custom-token-mismatch') {
    return '認証トークンが一致しません。再度ログインしてください。';
  }
  if (error.code === 'auth/argument-error') {
    return 'トークンの形式が正しくありません。再度ログインしてください。';
  }
  if (error.message?.includes('ERR_BLOCKED_BY_CLIENT')) {
    return '広告ブロッカーが有効になっているため、認証に失敗しました。このサイトの広告ブロッカーを無効にしてから、再度お試しください。';
  }
  return 'ログインに失敗しました。再度お試しください。';
};

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const verifyToken = async () => {
      console.log('Starting verification process...');
      try {
        const token = searchParams.get('token');
        const isNewUser = searchParams.get('isNewUser') === 'true';
        
        if (!token) {
          console.error('No token provided in URL parameters');
          throw new Error('No token provided');
        }

        if (!auth) {
          console.error('Firebase authentication is not initialized');
          throw new Error('Firebase authentication is not initialized');
        }

        // カスタムトークンでサインイン
        console.log('Attempting to sign in with custom token...');
        try {
          const userCredential = await signInWithCustomToken(auth, token);
          console.log('Successfully signed in with custom token:', {
            uid: userCredential.user.uid,
            isNewUser: userCredential.user.metadata.creationTime === userCredential.user.metadata.lastSignInTime
          });
        } catch (signInError: any) {
          console.error('Sign in error:', {
            code: signInError.code,
            message: signInError.message,
            name: signInError.name
          });
          setError(getErrorMessage(signInError));
          return;
        }

        // IDトークンを取得してセッションを作成
        console.log('Getting ID token...');
        const idToken = await auth.currentUser?.getIdToken(true); // forceRefresh=true
        
        if (!idToken) {
          console.error('Failed to get ID token after sign in');
          throw new Error('Failed to get ID token');
        }

        // セッションの作成
        console.log('Creating session...');
        const response = await fetch('/api/auth/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ idToken }),
        });

        if (!response.ok) {
          const responseData = await response.json();
          console.error('Session creation failed:', responseData);
          throw new Error(responseData.error || 'Failed to create session');
        }

        console.log('Session created successfully');

        // 適切なページにリダイレクト
        const redirectPath = isNewUser ? '/register/caution' : '/home';
        console.log('Redirecting to:', redirectPath);
        router.push(redirectPath);

      } catch (error: any) {
        console.error('Verification error:', {
          message: error.message,
          code: error.code,
          stack: error.stack
        });
        setError(getErrorMessage(error));
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
      <div className="text-center max-w-md mx-auto px-4">
        <h1 className="text-2xl font-bold mb-4 text-red-600">認証エラー</h1>
        <p className="mb-6 text-gray-700">{error}</p>
        <div className="space-y-4">
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            再試行
          </button>
          <button
            onClick={() => router.push('/login')}
            className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            ログインページに戻る
          </button>
        </div>
      </div>
    </div>
  ) : null;
} 