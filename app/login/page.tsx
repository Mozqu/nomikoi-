'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth } from '@/app/firebase/config'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'

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
      })
      
      // レスポンスの詳細を確認
      let responseData
      try {
        responseData = await response.json()
      } catch (e) {
        console.error('Failed to parse response:', e)
        throw new Error('Invalid response from server')
      }
      
      console.log('API response status:', response.status)
      console.log('API response data:', responseData)
      
      if (!response.ok) {
        throw new Error(`セッションの作成に失敗しました: ${responseData.error || response.statusText}`)
      }
      
      console.log('Session created successfully, redirecting to:', callbackUrl)
      router.push(callbackUrl)
    } catch (error) {
      console.error('セッション作成エラー:', error)
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
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const idToken = await userCredential.user.getIdToken()
      await createSession(idToken)
    } catch (error: any) {
      console.error('ログインエラー:', error)
      setError('メールアドレスまたはパスワードが正しくありません')
      setLoading(false)
    }
  }
  
  // Googleでログイン
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
          <Button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full bg-white hover:bg-gray-100 text-gray-900 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Googleでログイン
            </Button>

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
