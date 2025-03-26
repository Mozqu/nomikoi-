'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '@/app/firebase/config';

export default function VerifyAuth() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const token = searchParams.get('token');
        console.log('トークンの確認中...');

        if (!token) {
          console.error('認証トークンが見つかりません');
          throw new Error('認証トークンが見つかりません');
        }

        if (!auth) {
          console.error('Firebase認証が初期化されていません');
          throw new Error('Firebase認証が初期化されていません');
        }

        console.log('Firebaseサインイン開始...');
        const userCredential = await signInWithCustomToken(auth, token);
        console.log('Firebaseサインイン成功');

        // IDトークンを取得
        console.log('IDトークンを取得中...');
        const idToken = await userCredential.user.getIdToken();
        
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
      } catch (err) {
        console.error('認証エラー:', err);
        let errorMessage = '認証処理中にエラーが発生しました';
        
        if (err instanceof Error) {
          if (err.message.includes('auth/invalid-custom-token')) {
            errorMessage = '無効な認証トークンです';
          } else if (err.message.includes('auth/custom-token-mismatch')) {
            errorMessage = 'トークンが一致しません';
          } else if (err.message.includes('セッションの作成に失敗')) {
            errorMessage = 'セッションの作成に失敗しました';
          } else {
            errorMessage = err.message;
          }
        }
        
        setError(errorMessage);
      }
    };

    verifyAuth();
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="mt-4 text-sm text-red-600 hover:text-red-700"
          >
            ログインページに戻る
          </button>
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