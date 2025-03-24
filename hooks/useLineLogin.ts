import { useState, useEffect } from 'react'
import { signInWithCustomToken } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import liff from '@line/liff'

export const useLineLogin = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const initializeLiff = async () => {
      try {
        await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! })
      } catch (err) {
        setError(err instanceof Error ? err : new Error('LIFF initialization failed'))
      } finally {
        setLoading(false)
      }
    }
    initializeLiff()
  }, [])

  const loginWithLine = async () => {
    try {
      setLoading(true)
      // LINEログインを実行
      await liff.login()
      
      // カスタムトークンを取得するAPIを呼び出し
      const response = await fetch('/api/auth/line-firebase-token', {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error('Failed to get Firebase token')
      }
      
      const { customToken } = await response.json()
      
      // Firebaseにサインイン
      await signInWithCustomToken(auth, customToken)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Login failed'))
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    loginWithLine
  }
} 