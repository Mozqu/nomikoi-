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

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (auth === null || db === null) {
      setError("Firebase initialization failed.")
    }
    setIsLoading(false)
  }, [])

  const saveUserToFirestore = async (user: any) => {
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
    if (auth === null || db === null) {
      setError("Firebase is not initialized.")
      return
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      await saveUserToFirestore(userCredential.user)
      router.push("/register")
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

  const handleGoogleSignup = async () => {
    if (auth === null || db === null) {
      setError("Firebase is not initialized.")
      return
    }
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      await saveUserToFirestore(result.user)
      router.push("/register")
    } catch (error) {
      setError("Googleでのサインアップに失敗しました。")
    }
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cyber-dark cyberpunk-bg">
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
          <div className="space-y-4">
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

            <Button
              type="button"
              onClick={handleGoogleSignup}
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
              Googleで登録
            </Button>
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

