"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from 'next/navigation'
import { doc, updateDoc } from "firebase/firestore"
import { db, auth } from "@/app/firebase/config"

export default function LineConnect() {
  const searchParams = useSearchParams()
  const lineUserId = searchParams.get('lineUserId')
  const [isConnecting, setIsConnecting] = useState(false)

  useEffect(() => {
    const connectLine = async () => {
      if (!lineUserId || !auth.currentUser) return
      
      setIsConnecting(true)
      try {
        // ユーザードキュメントを更新
        const userRef = doc(db, "users", auth.currentUser.uid)
        await updateDoc(userRef, {
          lineUserId: lineUserId,
          lineConnected: true
        })

        // 成功メッセージを表示
        alert('LINE連携が完了しました！')
        // メッセージページに戻る
        window.location.href = '/messages'
      } catch (error) {
        console.error("LINE連携エラー:", error)
        alert('LINE連携に失敗しました')
      } finally {
        setIsConnecting(false)
      }
    }

    if (lineUserId) {
      connectLine()
    }
  }, [lineUserId])

  return (
    <div className="p-4 text-center">
      {isConnecting ? (
        <p>LINE連携中...</p>
      ) : (
        <p>LINEアカウントと連携してください</p>
      )}
    </div>
  )
}
