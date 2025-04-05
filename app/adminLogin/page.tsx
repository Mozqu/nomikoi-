'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth } from '@/app/firebase/config'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import LineAuthButton from '@/app/components/LineAuthButton'
import { getDoc, doc } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { db } from '@/app/firebase/config'

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
  
  // メールとパスワードでログイン
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      if (!email || !password) {
        throw new Error("メールアドレスとパスワードを入力してください")
      }

      if (!auth || !db) {
        throw new Error("認証システムが初期化されていません")
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      if (!userCredential || !userCredential.user) {
        throw new Error("ログインに失敗しました")
      }

      // 管理者権限の確認
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid))
      const userData = userDoc.data()
      
      if (!userData || !userData.isAdmin) {
        await signOut(auth)
        throw new Error("管理者権限がありません")
      }

      router.push('/admin/dashboard')
    } catch (error) {
      let errorMessage = "ログインに失敗しました"
      
      if (error instanceof Error) {
        // Firebase Auth のエラーコードに基づいてメッセージを設定
        switch ((error as any)?.code) {
          case 'auth/invalid-email':
            errorMessage = "無効なメールアドレスです"
            break
          case 'auth/user-disabled':
            errorMessage = "このアカウントは無効化されています"
            break
          case 'auth/user-not-found':
            errorMessage = "ユーザーが見つかりません"
            break
          case 'auth/wrong-password':
            errorMessage = "パスワードが間違っています"
            break
          case 'auth/too-many-requests':
            errorMessage = "ログイン試行回数が多すぎます。しばらく時間をおいて再度お試しください"
            break
          default:
            errorMessage = error.message || "予期せぬエラーが発生しました"
        }
      }
      
      console.error("ログインエラーの詳細:", { error, errorCode: (error as any)?.code, errorMessage })
      setError(errorMessage)
    } finally {
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
