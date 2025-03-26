'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithCustomToken, getAuth, onAuthStateChanged, Auth } from 'firebase/auth';
import { auth } from '@/app/firebase/config';

interface SessionResponse {
  status: string;
  user: {
    uid: string;
    email: string | null;
    isNewUser: boolean;
  };
}

export default function VerifyAuth() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [showAdBlockerWarning, setShowAdBlockerWarning] = useState(false);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const token = searchParams.get('token');
        console.log('認証プロセス開始...', { hasToken: !!token });

        if (!auth) {
          console.error('Firebase認証が初期化されていません');
          throw new Error('Firebase認証が初期化されていません');
        }

        // トークンがない場合は、既存のFirebase認証状態を確認
        if (!token) {
          console.log('トークンなし - Firebase認証状態を確認中...');
          return new Promise<void>((resolve) => {
            const unsubscribe = onAuthStateChanged(auth as Auth, async (user) => {
              unsubscribe();

              if (!user) {
                console.log('認証されていないユーザー - ログインページにリダイレクト');
                router.push('/login');
                return resolve();
              }

              try {
                console.log('既存のユーザーセッションを検出:', {
                  uid: user.uid,
                  email: user.email
                });

                const idToken = await user.getIdToken(true);
                await createSession(idToken);
                router.push('/');
              } catch (error) {
                handleSessionError(error);
              }
              resolve();
            });
          });
        }

        // カスタムトークンでのサインインフロー
        console.log('カスタムトークンでのサインイン開始...');
        try {
          const userCredential = await signInWithCustomToken(auth as Auth, token);
          console.log('Firebaseサインイン成功:', {
            uid: userCredential.user.uid,
            email: userCredential.user.email
          });

          const idToken = await userCredential.user.getIdToken(true);
          const sessionData = await createSession(idToken);

          // 新規ユーザーの判定を改善
          const isNewUser = sessionData?.user?.isNewUser || searchParams.get('isNewUser') === 'true';
          
          if (isNewUser) {
            console.log('新規ユーザー: プロフィール設定ページへリダイレクト');
            router.push('/profile/setup');
          } else {
            console.log('既存ユーザー: ホームページへリダイレクト');
            router.push('/');
          }
        } catch (signInError: any) {
          console.error('Firebaseサインインエラー:', signInError);
          handleAuthError(signInError);
        }
      } catch (err) {
        console.error('認証エラー:', err);
        handleError(err);
      }
    };

    // セッション作成を共通化
    const createSession = async (idToken: string): Promise<SessionResponse | null> => {
      console.log('セッションを作成中...');
      try {
        const sessionResponse = await fetch('/api/auth/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ idToken }),
        });

        if (!sessionResponse.ok) {
          const errorData = await sessionResponse.json();
          console.error('セッション作成エラー:', errorData);
          throw new Error(errorData.error || 'セッションの作成に失敗しました');
        }

        const data: SessionResponse = await sessionResponse.json();
        console.log('セッション作成成功:', data);
        return data;
      } catch (error) {
        handleSessionError(error);
        return null;
      }
    };

    // セッションエラーハンドリング
    const handleSessionError = (error: any) => {
      console.error('セッションエラー:', error);
      if (error.message?.includes('ERR_BLOCKED_BY_CLIENT')) {
        setShowAdBlockerWarning(true);
        setError('広告ブロッカーが有効になっているため、認証に失敗しました');
      } else {
        setError('セッションの作成に失敗しました。再度お試しください');
      }
    };

    // 認証エラーハンドリング
    const handleAuthError = (error: any) => {
      if (error.message?.includes('ERR_BLOCKED_BY_CLIENT')) {
        setShowAdBlockerWarning(true);
        setError('広告ブロッカーが有効になっているため、認証に失敗しました');
      } else if (error.code === 'auth/invalid-custom-token') {
        setError('無効な認証トークンです');
      } else if (error.code === 'auth/custom-token-mismatch') {
        setError('トークンが一致しません');
      } else if (error.code === 'auth/invalid-credential') {
        setError('認証情報が無効です。再度ログインしてください');
      } else {
        setError('認証に失敗しました。再度お試しください');
      }
    };

    // 一般エラーハンドリング
    const handleError = (error: any) => {
      let errorMessage = '認証処理中にエラーが発生しました';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      setError(errorMessage);
    };

    verifyAuth();
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-red-600 text-center mb-4">{error}</p>
          {showAdBlockerWarning && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-yellow-800 text-sm">
                このサイトの広告ブロッカーを無効にしてから、再度お試しください。
                広告ブロッカーがFirebaseの通信をブロックしている可能性があります。
              </p>
            </div>
          )}
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
            >
              再試行
            </button>
            <button
              onClick={() => router.push('/login')}
              className="px-4 py-2 text-sm text-white bg-red-600 rounded hover:bg-red-700 transition-colors"
            >
              ログインページに戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-600">認証処理中...</p>
      </div>
    </div>
  );
} 