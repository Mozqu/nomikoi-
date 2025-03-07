"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  TwitterAuthProvider,
  signInWithEmailAndPassword,
} from "firebase/auth"
import { auth, db } from "../firebase/config"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FaGoogle, FaFacebook, FaTwitter } from "react-icons/fa"
import { motion } from "framer-motion"
import type React from "react"
import { getDoc, doc } from "firebase/firestore"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (auth === null) {
      setError("Firebase initialization failed. Please check your configuration.")
    }
    setIsLoading(false)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (auth === null || db === null) {
      setError("Firebase is not initialized.")
      return
    }
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      
      // Firestoreからユーザーデータを取得
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid))
      const userData = userDoc.data()
      
      // 必須項目のチェック
      if (!userData?.name || !userData?.birthday || !userData?.gender) {
        router.push("/register")
      } else {
        router.push("/home")
      }
    } catch (error: any) {
      switch (error.code) {
        case 'auth/user-not-found':
          setError("メールアドレスが見つかりません。")
          break
        case 'auth/wrong-password':
          setError("パスワードが間違っています。")
          break
        default:
          setError("ログインに失敗しました。")
      }
    }
  }

  const handleSocialLogin = async (provider: GoogleAuthProvider | FacebookAuthProvider | TwitterAuthProvider) => {
    if (auth === null) {
      setError("Firebase is not initialized. Unable to log in.")
      return
    }
    try {
      await signInWithPopup(auth, provider)
      router.push("/dashboard")
    } catch (error) {
      setError("ソーシャルログインに失敗しました。もう一度お試しください。")
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
        <h2 className="text-3xl font-bold mb-6 text-center text-neon-blue text-glow">ログイン</h2>
        {auth === null ? (
          <p className="text-red-500 text-center mb-4">
            Firebase initialization failed. Please check your configuration.
          </p>
        ) : (
          <>
            <form onSubmit={handleLogin} className="space-y-4">
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
                ログイン
              </Button>
            </form>
            <div className="mt-4 flex flex-col space-y-2">
              <Button
                onClick={() => handleSocialLogin(new GoogleAuthProvider())}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                <FaGoogle className="mr-2" /> Googleでログイン
              </Button>
              <Button
                onClick={() => handleSocialLogin(new FacebookAuthProvider())}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <FaFacebook className="mr-2" /> Facebookでログイン
              </Button>
              <Button
                onClick={() => handleSocialLogin(new TwitterAuthProvider())}
                className="w-full bg-blue-400 hover:bg-blue-500 text-white"
              >
                <FaTwitter className="mr-2" /> Twitterでログイン
              </Button>
            </div>
          </>
        )}
        {error && <p className="mt-4 text-red-500 text-center">{error}</p>}
        <p className="mt-4 text-center text-gray-400">
          アカウントをお持ちでない方は
          <a href="/signup" className="text-neon-pink hover:underline">
            こちら
          </a>
        </p>
      </motion.div>
    </div>
  )
}

