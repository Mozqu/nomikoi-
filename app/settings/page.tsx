"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ChevronLeft, LogOut } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { auth } from "@/app/firebase/config"
import { signOut } from "firebase/auth"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      await signOut(auth)
      router.push("/login")
    } catch (error) {
      console.error("ログアウトに失敗しました:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neon-blue/30 via-neon-purple/30 to-neon-pink/30">
      {/* ヘッダー */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-black/10 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center h-16 px-4">
          <Link href={`/profile/${auth.currentUser?.uid}`}>
            <Button variant="ghost" size="icon" className="mr-2 text-white hover:text-white/80">
              <ChevronLeft className="h-6 w-6" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-white">設定</h1>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="pt-20 px-4 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* プロフィール設定 */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-neon-pink">プロフィール設定</h2>
            <Link href="/register">
              <Button
                variant="outline"
                className="w-full justify-start text-left h-auto py-4 bg-black/20 hover:bg-black/30 text-white border-white/10"
              >
                基本プロフィールを編集
              </Button>
            </Link>
            <Link href="/register/drunk_personality">
              <Button
                variant="outline"
                className="w-full justify-start text-left h-auto py-4 bg-black/20 hover:bg-black/30 text-white border-white/10"
              >
                お酒の好みを編集
              </Button>
            </Link>
          </section>

          {/* アカウント設定 */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-neon-pink">アカウント設定</h2>
            <Button
              variant="outline"
              className="w-full justify-start text-left h-auto py-4 bg-black/20 hover:bg-black/30 text-white border-white/10"
              onClick={handleLogout}
              disabled={isLoading}
            >
              <LogOut className="mr-2 h-4 w-4" />
              ログアウト
            </Button>
          </section>
        </motion.div>
      </div>
    </div>
  )
} 