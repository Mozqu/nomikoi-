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
        await signInWithCustomToken(auth, token);
        console.log('Firebaseサインイン成功');

        // 新規ユーザーかどうかを確認
        const isNewUser = searchParams.get('isNewUser') === 'true';
        
        // 新規ユーザーの場合はプロフィール設定ページへ
        if (isNewUser) {
          router.push('/profile/setup');
        } else {
          // 既存ユーザーはホームページへ
          router.push('/');
        }
      } catch (err) {
        console.error('認証エラー:', err);
        setError(err instanceof Error ? err.message : '認証処理中にエラーが発生しました');
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