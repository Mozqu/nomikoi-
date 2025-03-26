'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithCustomToken, getAuth, onAuthStateChanged, Auth } from 'firebase/auth';
import { auth } from '@/app/firebase/config';

export default function VerifyAuth() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [showAdBlockerWarning, setShowAdBlockerWarning] = useState(false);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const token = searchParams.get('token');
        console.log('認証プロセス開始...');

        if (!auth) {
          console.error('Firebase認証が初期化されていません');
          throw new Error('Firebase認証が初期化されていません');
        }

        // トークンがない場合は、既存のFirebase認証状態を確認
        if (!token) {
          console.log('トークンなし - Firebase認証状態を確認中...');
          return new Promise<void>((resolve) => {
            const unsubscribe = onAuthStateChanged(auth as Auth, async (user) => {
              unsubscribe(); // リスナーを解除

              if (user) {
                console.log('既存のユーザーセッションを検出:', {
                  uid: user.uid,
                  email: user.email
                });

                try {
                  // IDトークンを取得
                  console.log('IDトークンを取得中...');
                  const idToken = await user.getIdToken(true);
                  
                  // セッションの作成
                  console.log('セッションを作成中...');
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

                  console.log('セッション作成成功');
                  router.push('/');
                } catch (sessionError: any) {
                  console.error('セッション作成エラー:', sessionError);
                  if (sessionError.message?.includes('ERR_BLOCKED_BY_CLIENT')) {
                    setShowAdBlockerWarning(true);
                    throw new Error('広告ブロッカーが有効になっているため、認証に失敗しました');
                  }
                  throw new Error('セッションの作成に失敗しました');
                }
              } else {
                console.log('認証されていないユーザー');
                router.push('/login');
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

          // IDトークンを取得
          console.log('IDトークンを取得中...');
          const idToken = await userCredential.user.getIdToken(true);
          
          // セッションの作成
          console.log('セッションを作成中...');
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

          console.log('セッション作成成功');

          // 新規ユーザーかどうかを確認
          const isNewUser = searchParams.get('isNewUser') === 'true';
          
          // 新規ユーザーの場合はプロフィール設定ページへ
          if (isNewUser) {
            console.log('新規ユーザー: プロフィール設定ページへリダイレクト');
            router.push('/profile/setup');
          } else {
            console.log('既存ユーザー: ホームページへリダイレクト');
            router.push('/');
          }
        } catch (signInError: any) {
          console.error('Firebaseサインインエラー:', signInError);
          if (signInError.message?.includes('ERR_BLOCKED_BY_CLIENT')) {
            setShowAdBlockerWarning(true);
            throw new Error('広告ブロッカーが有効になっているため、認証に失敗しました');
          }
          if (signInError.code === 'auth/invalid-custom-token') {
            throw new Error('無効な認証トークンです');
          } else if (signInError.code === 'auth/custom-token-mismatch') {
            throw new Error('トークンが一致しません');
          } else if (signInError.code === 'auth/invalid-credential') {
            throw new Error('認証情報が無効です。再度ログインしてください');
          } else {
            throw new Error('認証に失敗しました。再度お試しください');
          }
        }
      } catch (err) {
        console.error('認証エラー:', err);
        let errorMessage = '認証処理中にエラーが発生しました';
        
        if (err instanceof Error) {
          errorMessage = err.message;
        }
        
        setError(errorMessage);
      }
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