"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { auth, db } from "../firebase/config"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"
import type React from "react" // Added import for React
import { LineLoginButton } from '../components/LineLoginButton'

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (auth === null) {
      setError("Firebase initialization failed.")
    }
    setIsLoading(false)
  }, [])

  const saveUserToFirestore = async (user: any) => {
    if (!db) {
      setError("データベースの初期化に失敗しました。")
      return
    }
    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      uid: user.uid,
      createdAt: new Date(),
      name: user.displayName || "",
      photoURL: user.photoURL || "",
      birthday: null,
      gender: "",
      bio: "",
      interests: [],
      favoriteBars: [],
      drunk_personality: "",
    })
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (auth === null) {
      setError("Firebase is not initialized.")
      return
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      await saveUserToFirestore(userCredential.user)
      router.push("/register/caution")
    } catch (error: any) {
      // Firebase Authentication のエラーをハンドリング
      switch (error.code) {
        case 'auth/email-already-in-use':
          setError("このメールアドレスは既に使用されています。")
          break
        case 'auth/invalid-email':
          setError("無効なメールアドレスです。")
          break
        case 'auth/operation-not-allowed':
          setError("メール/パスワードでの認証が無効になっています。")
          break
        case 'auth/weak-password':
          setError("パスワードが弱すぎます。")
          break
        default:
          console.error(error)
          setError("サインアップに失敗しました。")
      }
    }
  }

  /*
  const handleGoogleSignup = async () => {
    if (auth === null) {
      setError("Firebase is not initialized.")
      return
    }
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      await saveUserToFirestore({
        uid: result.user.uid,
        email: result.user.email,
      })
      router.push("/register/caution")
    } catch (error) {
      setError("Googleでのサインアップに失敗しました。")
    }
  }
  */

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-2xl font-bold mb-4">新規登録</h1>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="bg-gray-900 p-8 rounded-lg shadow-lg w-96"
      >
        <h2 className="text-3xl font-bold mb-6 text-center text-neon-blue text-glow">サインアップ</h2>
        {auth === null ? (
          <p className="text-red-500 text-center mb-4">
            Firebase initialization failed. Please check your configuration.
          </p>
        ) : (
          <div className="space-y-4 flex flex-col">
            {/* メールアドレスで登録 */}
            <form onSubmit={handleSignup} className="space-y-4">
              <Input
                type="email"
                placeholder="メールアドレス"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-800 text-white"
              />
              <Input
                type="password"
                placeholder="パスワード"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-800 text-white"
              />
              <Button type="submit" className="w-full bg-neon-purple hover:bg-neon-purple/80 text-white">
                メールアドレスで登録
              </Button>
            </form>
            

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-900 text-gray-400">または</span>
              </div>
            </div>

            <LineLoginButton />
            
          </div>
        )}
        {error && <p className="mt-4 text-red-500 text-center">{error}</p>}
        <p className="mt-4 text-center text-gray-400">
          すでにアカウントをお持ちの方は
          <a href="/login" className="text-neon-pink hover:underline">
            こちら
          </a>
        </p>
      </motion.div>
      
    </div>
  )
}

