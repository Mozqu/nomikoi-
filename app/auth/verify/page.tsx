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
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const verifyAuth = async () => {
      if (isProcessing) return; // 処理の重複を防ぐ
      setIsProcessing(true);

      try {
        const token = searchParams.get('token');
        const isNewUser = searchParams.get('isNewUser');
        
        console.log('認証プロセス開始...', { 
          hasToken: !!token, 
          tokenLength: token?.length,
          isNewUser: isNewUser,
          currentUrl: window.location.href,
          timestamp: new Date().toISOString(),
          authState: {
            isInitialized: !!auth,
            hasCurrentUser: !!auth?.currentUser,
            currentUserUid: auth?.currentUser?.uid,
            authObject: auth ? 'exists' : 'null',
            firebaseApps: window.firebase?.apps?.length || 0
          }
        });

        // Firebaseの初期化を待機
        let retryCount = 0;
        while (!auth && retryCount < 5) {
          console.log(`Firebase認証の初期化を待機中... (試行: ${retryCount + 1})`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          retryCount++;
        }

        if (!auth) {
          throw new Error('Firebase認証の初期化に失敗しました');
        }

        // カスタムトークンが存在する場合の処理
        if (token) {
          console.log('カスタムトークンでのサインイン開始', {
            tokenInfo: {
              length: token.length,
              prefix: token.substring(0, 10) + '...',
              isValid: token.length > 100 // カスタムトークンは通常100文字以上
            },
            authState: {
              isInitialized: !!auth,
              currentUser: auth?.currentUser ? 'exists' : 'null'
            }
          });
          
          try {
            // 既存のユーザーをサインアウト
            if (auth.currentUser) {
              console.log('既存のユーザーをサインアウト', {
                uid: auth.currentUser.uid,
                email: auth.currentUser.email,
                timestamp: new Date().toISOString()
              });
              await auth.signOut();
              console.log('サインアウト完了');
            }

            // カスタムトークンでサインイン
            const userCredential = await signInWithCustomToken(auth, token);
            console.log('カスタムトークンサインイン成功:', {
              uid: userCredential.user.uid,
              email: userCredential.user.email
            });

            // IDトークンを取得
            const idToken = await userCredential.user.getIdToken(true);
            console.log('IDトークン取得成功');

            // セッションを作成
            const sessionData = await createSession(idToken);
            if (!sessionData) {
              throw new Error('セッションの作成に失敗しました');
            }

            // リダイレクト
            

          } catch (error) {
            console.error('認証エラー:', error);
            handleAuthError(error);
          }
        } else {
          // トークンがない場合は既存のセッションを確認
          console.log('トークンなし - 既存のセッションを確認');
          
          return new Promise<void>((resolve) => {
            const unsubscribe = onAuthStateChanged(auth, async (user) => {
              unsubscribe();
              
              if (user) {
                try {
                  console.log('既存のユーザーセッションを検出:', {
                    uid: user.uid,
                    email: user.email
                  });
                  
                  const idToken = await user.getIdToken(true);
                  const sessionData = await createSession(idToken);
                  
                  if (sessionData) {
                    console.log('セッションデータ:', sessionData)
                    // router.pushを削除
                    // layout.tsxのgetProfileStatus()とredirectBasedOnProfile()に任せる
                  } else {
                    router.push('/login');
                  }
                } catch (error) {
                  console.error('セッション更新エラー:', error);
                  handleSessionError(error);
                }
              } else {
                console.log('認証されていないユーザー');
                router.push('/login');
              }
              resolve();
            });
          });
        }
      } catch (error) {
        console.error('認証プロセスエラー:', error);
        handleError(error);
      } finally {
        setIsProcessing(false);
      }
    };

    const createSession = async (idToken: string): Promise<SessionResponse | null> => {
      try {
        console.log('セッション作成開始', {
          tokenLength: idToken.length,
          timestamp: new Date().toISOString(),
          url: '/api/auth/session',
          requestInfo: {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            }
          }
        });
        
        const response = await fetch('/api/auth/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ idToken }),
          credentials: 'include'
        });

        console.log('セッションレスポンス受信:', {
          status: response.status,
          ok: response.ok,
          headers: {
            contentType: response.headers.get('content-type'),
            setCookie: response.headers.get('set-cookie')
          },
          timestamp: new Date().toISOString()
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'セッション作成に失敗しました');
        }

        const data = await response.json();
        console.log('セッションデータ:', data)
        console.log('セッション作成成功:', {
          status: data.status,
          uid: data.user.uid,
          isNewUser: data.user.isNewUser,
          timestamp: new Date().toISOString(),
          cookies: {
            all: document.cookie.split(';').map(c => c.trim()),
            hasSessionCookie: document.cookie.includes('session='),
            cookieCount: document.cookie.split(';').length
          }
        });
        
        return data;
      } catch (error) {
        console.error('セッション作成エラー:', error);
        handleSessionError(error);
        return null;
      }
    };

    const handleAuthError = (error: any) => {
      console.error('認証エラーハンドリング:', {
        code: error.code,
        message: error.message,
        timestamp: new Date().toISOString(),
        errorType: error.name,
        stack: error.stack,
        authState: {
          isInitialized: !!auth,
          hasCurrentUser: !!auth?.currentUser
        }
      });
      if (error.message?.includes('ERR_BLOCKED_BY_CLIENT')) {
        setShowAdBlockerWarning(true);
        setError('広告ブロッカーが有効になっているため、認証に失敗しました');
      } else if (error.code === 'auth/invalid-custom-token') {
        setError('無効な認証トークンです');
      } else if (error.code === 'auth/custom-token-mismatch') {
        setError('トークンが一致しません');
      } else {
        setError('認証に失敗しました。再度お試しください');
      }
    };

    const handleSessionError = (error: any) => {
      console.error('セッションエラーハンドリング:', {
        error: {
          message: error.message,
          type: error.name,
          stack: error.stack
        },
        timestamp: new Date().toISOString(),
        cookies: {
          exists: document.cookie.length > 0,
          count: document.cookie.split(';').length
        }
      });
      if (error.message?.includes('ERR_BLOCKED_BY_CLIENT')) {
        setShowAdBlockerWarning(true);
        setError('広告ブロッカーが有効になっているため、認証に失敗しました');
      } else {
        setError('セッションの作成に失敗しました。再度お試しください');
      }
    };

    const handleError = (error: any) => {
      console.error('一般エラーハンドリング:', error);
      setError(error instanceof Error ? error.message : '認証処理中にエラーが発生しました');
    };

    verifyAuth();
  }, [searchParams, router, isProcessing]);

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
              onClick={() => {
                setError(null);
                setShowAdBlockerWarning(false);
                setIsProcessing(false);
                window.location.reload();
              }}
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