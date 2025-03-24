'use client'

import { signIn, signOut, useSession } from 'next-auth/react'

export default function LineLogin() {
  const { data: session } = useSession()

  if (session) {
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-green-600">ログイン中: {session.user?.name}</p>
        <button
          onClick={() => signOut()}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          ログアウト
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => signIn('line')}
      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
    >
      LINEでログイン
    </button>
  )
} 