'use client'

import { useEffect } from 'react'
import { useLineLogin } from '@/hooks/useLineLogin'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/lib/firebase'

export default function LineFirebaseLogin() {
  const { loading: liffLoading, error: liffError, loginWithLine } = useLineLogin()
  const [user, loading, error] = useAuthState(auth)

  if (liffLoading || loading) {
    return <div>読み込み中...</div>
  }

  if (liffError || error) {
    return <div>エラーが発生しました</div>
  }

  if (user) {
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-green-600">ログイン中: {user.displayName}</p>
        <button
          onClick={() => auth.signOut()}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          ログアウト
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={loginWithLine}
      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
    >
      LINEでログイン
    </button>
  )
} 