'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth } from '@/app/firebase/config'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  
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
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">ログイン</h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleEmailLogin}>
        <div className="mb-4">
          <label className="block mb-2">メールアドレス</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        
        <div className="mb-6">
          <label className="block mb-2">パスワード</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
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
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white border border-gray-300 text-gray-700 py-2 rounded hover:bg-gray-50 disabled:bg-gray-100"
        >
          Googleでログイン
        </button>
      </div>
    </div>
  )
}