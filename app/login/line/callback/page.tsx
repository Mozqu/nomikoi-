'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signInWithCustomToken } from 'firebase/auth'
import { auth } from '../../../firebase/config'

export default function LineCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code')
        const error = searchParams.get('error')
        const state = searchParams.get('state')

        if (error) {
          setError('認証がキャンセルされました')
          return
        }

        if (!code) {
          setError('認証コードが見つかりません')
          return
        }

        // バックエンドにコードを送信してカスタムトークンを取得
        const response = await fetch('/api/auth/line', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || '認証に失敗しました')
        }

        const { customToken } = await response.json()

        // Firebaseにサインイン
        if (!auth) {
          throw new Error('Firebase認証が初期化されていません')
        }
        await signInWithCustomToken(auth, customToken)

        // ホームページにリダイレクト
        router.push('/')
      } catch (err) {
        console.error('Callback error:', err)
        setError(err instanceof Error ? err.message : '認証処理中にエラーが発生しました')
      }
    }

    handleCallback()
  }, [searchParams, router])

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
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-600">認証処理中...</p>
      </div>
    </div>
  )
} 