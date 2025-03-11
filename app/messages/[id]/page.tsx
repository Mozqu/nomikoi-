"use client"

import { useEffect, useState, useRef } from "react"
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "@/app/firebase/config"
import { onAuthStateChanged } from "firebase/auth"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronLeft, Send } from "lucide-react"
import { use } from "react"

interface Message {
  id: string
  text: string
  created_at: any
  user_id: string
  user_name: string
  user_photo: string
}

export default function ChatRoom({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [user, setUser] = useState<any>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const messagesEndRef = useRef<null | HTMLDivElement>(null)
  const router = useRouter()
  
  // 認証状態の監視
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

  // メッセージのリアルタイム取得
  useEffect(() => {
    if (!id) return

    const messagesRef = collection(db, "message_rooms", id, "messages")
    const q = query(messagesRef, orderBy("created_at", "asc"))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate?.()
          ? doc.data().created_at.toDate().toLocaleString('ja-JP')
          : ''
      })) as Message[]
      setMessages(newMessages)
    })

    return () => unsubscribe()
  }, [id])

  // 新しいメッセージが追加されたら自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // メッセージ送信
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user) return

    try {
      const messagesRef = collection(db, "message_rooms", id, "messages")
      await addDoc(messagesRef, {
        text: newMessage,
        created_at: serverTimestamp(),
        user_id: user.uid,
        user_name: user.displayName || "Anonymous",
        user_photo: user.photoURL || "/placeholder.svg"
      })
      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  if (!user) {
    return <div className="p-4">ログインが必要です</div>
  }

  

  return (
    <div className="flex flex-col h-screen">
      {/* ヘッダー */}
      <div className="w-full p-2 flex justify-between items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/messages")}
          className="mr-2"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-semibold">チャット</h1>
        <div className="h-6 w-6"></div>
      </div>

      {/* メッセージ一覧 */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start gap-2 ${
              message.user_id === user.uid ? "flex-row-reverse" : ""
            }`}
          >
            {message.user_id === user.uid ? (
              ""
            ) : (
              <div className="relative w-8 h-8">
                <Image
                  src={message.user_photo}
                  alt={message.user_name}
                  fill
                  className="rounded-full object-cover"
                />
              </div>
            )}
            
            <div
              className={`max-w-[70%] p-2 rounded-lg ${
                message.user_id === user.uid
                  ? "bg-sky text-white"
                  : "bg-pink text-white"
              }`}
            >
              <p className="text-sm">{message.text}</p>
            </div>
            <span className="text-xs text-gray-500 mt-1"
              style={{  
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                alignItems: "flex-end",
              }}
              >

                <div className="flex-1">
                  {message.created_at.toLocaleString('ja-JP').split(' ')[0]}
                </div>
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* メッセージ入力フォーム */}
      <form onSubmit={sendMessage} className="p-2 ">
        <div className="flex gap-2 p-1 rounded-full border border-white/10">
          <Input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="メッセージを入力..."
            className="flex-1 rounded-full border-none "
            style={{
              outline: "none",
              boxShadow: "none",
              background: "rgba(255, 255, 255, 0.05)"
            }}
          />
          <Button className="rounded-full neon-bg" type="submit">
            <Send className="" />
          </Button>
        </div>
      </form>
    </div>
  )
}
