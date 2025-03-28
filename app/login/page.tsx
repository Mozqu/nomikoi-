'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth } from '@/app/firebase/config'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import LineAuthButton from '@/app/components/LineAuthButton'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/home'
  console.log('Callback URL:', callbackUrl) // デバッグ用
  
  // セッションクッキーを作成する関数
  const createSession = async (idToken: string) => {
    try {
      console.log('Creating session with token length:', idToken.length)
      
      // 絶対パスでAPIエンドポイントを指定
      const apiUrl = new URL('/api/login', window.location.origin).toString()
      console.log('Sending request to:', apiUrl)
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
        credentials: 'include',
        cache: 'no-store'
      })
      
      // レスポンスの内容を確認
      const responseText = await response.text()
      console.log('API Response Details:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        headers: Object.fromEntries(response.headers.entries()),
        rawResponse: responseText
      })
      
      let responseData
      try {
        responseData = responseText ? JSON.parse(responseText) : {}
        console.log('Parsed response data:', responseData)
      } catch (e) {
        console.error('Failed to parse response:', e)
        console.error('Response text was:', responseText)
        throw new Error(`サーバーからの応答が不正です (Status: ${response.status})`)
      }
      
      if (!response.ok) {
        const errorDetail = `APIエラー (${response.status}): ${
          response.status === 405 
            ? 'APIエンドポイントへのアクセスに問題があります。URLとメソッドを確認してください。' 
            : responseData.error || '不明なエラー'
        }`
        throw new Error(errorDetail)
      }
      
      if (responseData.status === 'error') {
        throw new Error(`セッション作成エラー: ${responseData.error || '不明なエラー'}`)
      }
      
      console.log('Session created successfully, redirecting to:', callbackUrl)
      router.push(callbackUrl)
    } catch (error) {
      console.error('セッション作成エラーの詳細:', error)
      setError('認証に失敗しました: ' + (error instanceof Error ? error.message : String(error)))
      setLoading(false)
    }
  }
  
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-cyber-dark cyberpunk-bg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="bg-gray-900 p-8 rounded-lg shadow-lg w-96"
      >
        <h1 className="text-3xl font-bold mb-6 text-center text-neon-blue text-glow">ログイン</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="mt-4">
          <LineAuthButton />
        </div>

        <p className="mt-4 text-center text-gray-400">
          新しくアカウントを作成する方は
          <a href="/signup" className="text-neon-pink hover:underline">
            こちら
          </a>
        </p>

        </motion.div>
    </div>
  )
}
