"use client"

import { useEffect, useState } from "react"
import { auth, db } from "@/app/firebase/config"
import { doc, updateDoc } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export default function LineConnect() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  
  // LINE公式アカウントのIDを環境変数から取得
  const LINE_BOT_ID = process.env.NEXT_PUBLIC_LINE_BOT_BASIC_ID // @xxx形式のID

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login")
        return
      }
      setUser(user)
    })
    return () => unsubscribe()
  }, [router])

  const handleLineConnect = () => {
    // モバイルデバイスかどうかを判定
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

    if (isMobile) {
      // LINEアプリを開くディープリンク
      window.location.href = `https://line.me/R/ti/p/${LINE_BOT_ID}`
    } else {
      // PCの場合はQRコードページにリダイレクト
      window.location.href = `https://line.me/R/ti/p/${LINE_BOT_ID}/QR`
    }
  }

  if (!user) {
    return <div className="p-4">ログインが必要です</div>
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="text-center mb-8">
        <Image
          src="/line-icon.png"
          alt="LINE"
          width={64}
          height={64}
          className="mx-auto mb-4 rounded"
        />
        <h1 className="text-2xl font-bold mb-2">LINE連携</h1>
        <p className="text-gray-500 mb-6">
          メッセージ通知を受け取るには、公式アカウントを友だち追加してください
        </p>
        
        <Button 
          onClick={handleLineConnect}
          className="bg-[#00B900] hover:bg-[#00A000] text-white w-full max-w-xs flex items-center justify-center gap-2"
        >
          <Image
            src="/line-white-icon.png"
            alt=""
            width={24}
            height={24}
            className="rounded"
          />
          LINE公式アカウントを追加
        </Button>
      </div>

      <div className="mt-8 text-sm text-gray-500">
        <h2 className="font-bold mb-2">連携手順:</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>上のボタンをタップしてLINEアプリを開く</li>
          <li>「追加」ボタンをタップして友だち追加</li>
          <li>メッセージ通知の受信設定を「オン」にする</li>
        </ol>
      </div>
    </div>
  )
}
