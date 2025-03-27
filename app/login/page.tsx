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
  
  // セッションクッキーを作成する関数
  const createSession = async (idToken: string) => {
    try {
      console.log('Creating session with token length:', idToken.length)
      
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
        cache: 'no-store'
      })
      
      // レスポンスの内容を確認
      const responseText = await response.text()
      console.log('Raw response:', responseText)
      console.log('Response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))
      
      let responseData
      try {
        // 空でない場合のみJSONとしてパース
        responseData = responseText ? JSON.parse(responseText) : {}
        console.log('Response data parsed successfully:', responseData)
      } catch (e) {
        console.error('Failed to parse response:', e)
        console.error('Response text was:', responseText)
        throw new Error(`サーバーからの応答が不正です (Status: ${response.status})`)
      }
      
      if (!response.ok) {
        throw new Error(`APIエラー (${response.status}): ${responseData.error || '不明なエラー'}`)
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
  
  // メールとパスワードでログイン
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      if (!auth) {
        throw new Error('認証システムが初期化されていません')
      }

      console.log('ログイン開始:', { email })
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      console.log('Firebase認証成功:', {
        uid: userCredential.user.uid,
        email: userCredential.user.email
      })

      const idToken = await userCredential.user.getIdToken()
      console.log('IDトークン取得成功:', {
        tokenLength: idToken.length,
        tokenPrefix: idToken.substring(0, 10) + '...'
      })

      await createSession(idToken)
    } catch (error: any) {
      console.error('ログインエラーの詳細:', {
        code: error.code,
        message: error.message,
        type: error.constructor.name,
        stack: error.stack
      })
      
      // エラーメッセージをより具体的に
      let errorMessage = 'ログインに失敗しました'
      if (error.code === 'auth/user-not-found' || 
          error.code === 'auth/wrong-password' || 
          error.code === 'auth/invalid-credential') {
        errorMessage = 'メールアドレスまたはパスワードが正しくありません'
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'ログイン試行回数が多すぎます。しばらく時間をおいてから再度お試しください'
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'ネットワークエラーが発生しました。インターネット接続を確認してください'
      }
      
      setError(errorMessage)
      setLoading(false)
    }
  }
  
  // Googleでログイン
  /*
  const handleGoogleLogin = async () => {
    setLoading(true)
    setError('')
    
    try {
      const provider = new GoogleAuthProvider()
      const userCredential = await signInWithPopup(auth, provider)
      const idToken = await userCredential.user.getIdToken()
      await createSession(idToken)
    } catch (error: any) {
      console.error('Googleログインエラー:', error)
      setError('Googleログインに失敗しました')
      setLoading(false)
    }
  }
  */
  
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

        {/* メールアドレスとパスワードの入力 */}
        <form onSubmit={handleEmailLogin}>
          <div className="mb-4">
            <label className="block mb-2">メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded text-black"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block mb-2">パスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded text-black"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>

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
