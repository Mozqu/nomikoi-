'use client'

import { signInWithCustomToken } from 'firebase/auth'
import { auth } from '@/app/firebase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LineAuthButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleLineLogin = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const clientId = process.env.NEXT_PUBLIC_LINE_CHANNEL_ID
      if (!clientId) {
        throw new Error('LINE Channel ID is not configured')
      }
      
      // LINEログインURLを生成
      const lineLoginUrl = `https://access.line.me/oauth2/v2.1/authorize?${new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: process.env.NEXT_PUBLIC_LINE_CALLBACK_URL || `${window.location.origin}/__/auth/handler`,
        state: 'random_state',
        scope: 'profile openid email',
      })}`

      // LINEログインページにリダイレクト
      window.location.href = lineLoginUrl
    } catch (error) {
      console.error('LINE login error:', error)
      setError(error instanceof Error ? error.message : 'ログインに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-2 text-sm text-red-600">
          {error}
        </div>
      )}
      <button
        onClick={handleLineLogin}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-[#00B900] text-white py-3 rounded-lg hover:bg-[#009900] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.105.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629" />
            </svg>
            LINEでログイン
          </>
        )}
      </button>
    </div>
  )
} 