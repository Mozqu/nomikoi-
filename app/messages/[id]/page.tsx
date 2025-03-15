"use client"

import { useEffect, useState, useRef } from "react"
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, getDoc, doc, where, getDocs, writeBatch, updateDoc } from "firebase/firestore"
import { auth, db } from "@/app/firebase/config"
import { onAuthStateChanged } from "firebase/auth"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronLeft, Send, X } from "lucide-react"
import { use } from "react"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

interface Message {
  id: string
  text: string
  created_at: any
  user_id: string
  user_name: string
  user_photo: string
  read: boolean
}

export default function ChatRoom({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [user, setUser] = useState<any>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [hasLineConnection, setHasLineConnection] = useState<boolean | null>(null)
  const [showLineModal, setShowLineModal] = useState(true)
  const messagesEndRef = useRef<null | HTMLDivElement>(null)
  const router = useRouter()
  
  // 認証状態の監視
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth!, (user) => {
      if (!user) {
        router.push("/login")
        return
      }
      setUser(user)
      console.log('user', user)
    })
    return () => unsubscribe()
  }, [router])

  // メッセージのリアルタイム取得
  useEffect(() => {
    if (!id) return

    const messagesRef = collection(db!, "message_rooms", id, "messages")
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

  // ユーザーのLINE連携状態を確認
  useEffect(() => {
    const checkLineConnection = async () => {
      if (!user) return

      try {
        const userDoc = await getDoc(doc(db!, "users", user.uid))
        const userData = userDoc.data()
        setHasLineConnection(!!userData?.lineUserId)
      } catch (error) {
        console.error("LINE連携状態の確認に失敗:", error)
      }
    }

    if (user) {
      checkLineConnection()
    }
  }, [user])

  // ローカルストレージを使用して表示制御
  useEffect(() => {
    const hasSeenModal = localStorage.getItem('hasSeenLineModal')
    const lastPromptTime = localStorage.getItem('lastLinePromptTime')
    const now = Date.now()
    const oneWeek = 7 * 24 * 60 * 60 * 1000

    if (!hasSeenModal || (lastPromptTime && now - Number(lastPromptTime) > oneWeek)) {
      setShowLineModal(true)
      localStorage.setItem('lastLinePromptTime', now.toString())
    }
  }, [])

  // LINE公式アカウントのIDを環境変数から取得
  const LINE_BOT_ID = process.env.NEXT_PUBLIC_LINE_BOT_BASIC_ID

  const handleLineConnect = () => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    if (isMobile) {
      window.location.href = `https://lin.ee/n3c1slA`
    } else {
      window.location.href = `https://lin.ee/${LINE_BOT_ID}/QR`
    }
  }

  // メッセージ送信
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user) return

    try {
      // ユーザー情報を取得
      const currentUserDoc = await getDoc(doc(db!, "users", user.uid))
      const currentUserData = currentUserDoc.data()
      const userName = currentUserData?.name || user.displayName || "匿名ユーザー"
      
      // Firestoreにメッセージを保存
      const messagesRef = collection(db!, "message_rooms", id, "messages")
      
      // 未読状態を明示的に設定
      const messageData = {
        text: newMessage,
        created_at: serverTimestamp(),
        user_id: user.uid,
        user_name: userName,
        user_photo: user.photoURL || "/placeholder.svg",
        read: false
      }
      
      await addDoc(messagesRef, messageData)

      // メッセージルームのupdated_atを更新
      const roomRef = doc(db!, "message_rooms", id)
      await updateDoc(roomRef, {
        updated_at: serverTimestamp()
      })

      // パートナーのユーザー情報を取得
      const roomDoc = await getDoc(doc(db!, "message_rooms", id))
      const roomData = roomDoc.data()
      const partnerId = roomData?.user_ids.find((uid: string) => uid !== user.uid)

      if (partnerId) {
        const partnerDoc = await getDoc(doc(db!, "users", partnerId))
        const partnerData = partnerDoc.data()

        console.log('user', user)

        // パートナーがLINE連携済みの場合、通知を送信
        if (partnerData?.lineUserId) {
          console.log("連携済みユーザー", partnerData.lineUserId)
          await fetch('/api/line-message', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: newMessage,
              lineUserId: partnerData.lineUserId,
              senderName: userName,
              messageRoomId: id
            })
          })
        }
      }

      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  // メッセージを読んだときに既読にする処理を追加
  useEffect(() => {
    if (!user || !id) return;

    const markMessagesAsRead = async () => {
      try {
        // 相手からのメッセージで未読のものを取得
        const messagesRef = collection(db!, "message_rooms", id, "messages");
        const q = query(
          messagesRef,
          where("user_id", "!=", user.uid),
          where("read", "==", false)
        );
        
        const unreadSnap = await getDocs(q);
        
        // 未読メッセージを既読に更新
        const batch = writeBatch(db!);
        unreadSnap.docs.forEach(doc => {
          batch.update(doc.ref, { read: true });
        });
        
        if (unreadSnap.size > 0) {
          await batch.commit();
          console.log(`${unreadSnap.size}件のメッセージを既読にしました`);
        }
      } catch (error) {
        console.error("既読の更新に失敗:", error);
      }
    };

    // ページが表示されたときに実行
    markMessagesAsRead();
    
    // メッセージが更新されたときにも実行
    const intervalId = setInterval(markMessagesAsRead, 5000);
    
    return () => clearInterval(intervalId);
  }, [user, id, messages]);

  // メッセージルームに入ったときに訪問履歴を記録
  useEffect(() => {
    if (!id || !user) return;

    const updateVisitHistory = async () => {
      try {
        // メッセージルームのドキュメントを取得
        const roomRef = doc(db!, "message_rooms", id);
        const roomDoc = await getDoc(roomRef);
        
        if (roomDoc.exists()) {
          // 訪問履歴を更新
          const roomData = roomDoc.data();
          const visitedUsers = roomData.visitedUsers || {};
          
          // 現在のユーザーが訪問済みでなければ更新
          if (!visitedUsers[user.uid]) {
            visitedUsers[user.uid] = serverTimestamp();
            await updateDoc(roomRef, { visitedUsers });
            console.log(`ユーザー ${user.uid} の訪問履歴を記録しました`);
          }
        }
      } catch (error) {
        console.error("訪問履歴の更新に失敗:", error);
      }
    };
    
    updateVisitHistory();
  }, [id, user]);

  const formatRelativeTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString; // パースできない場合は元の文字列を返す
      }

      const now = new Date();
      const diffInMilliseconds = now.getTime() - date.getTime();
      const diffInHours = diffInMilliseconds / (1000 * 60 * 60);
      const diffInDays = diffInHours / 24;
      const diffInWeeks = diffInDays / 7;
      const diffInMonths = diffInDays / 30;
      const diffInYears = diffInDays / 365;

      if (diffInHours < 24) {
        const hours = Math.floor(diffInHours);
        return hours === 0 ? 'たった今' : `${hours}時間前`;
      } else if (diffInDays < 7) {
        const days = Math.floor(diffInDays);
        return `${days}日前`;
      } else if (diffInDays < 30) {
        const weeks = Math.floor(diffInWeeks);
        return `${weeks}週間前`;
      } else if (diffInDays < 365) {
        const months = Math.floor(diffInMonths);
        return `${months}ヶ月前`;
      } else {
        const years = Math.floor(diffInYears);
        return `${years}年前`;
      }
    } catch (error) {
      console.error('Date formatting error:', error);
      return dateString; // エラーが発生した場合は元の文字列を返す
    }
  };

  if (!user) {
    return <div className="p-4">ログインが必要です</div>
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto  relative">
      {/* LINEモーダル */}
      <Dialog open={!hasLineConnection && showLineModal} onOpenChange={setShowLineModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Image
                src="/line-icon.png"
                alt="LINE"
                width={32}
                height={32}
                className="rounded"
              />
              LINE連携のお願い
            </DialogTitle>
            <DialogDescription className="pt-4">
              LINEと連携すると、新しいメッセージをLINEで受け取れるようになります。
              より便利にご利用いただけます。
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 pt-4">
            <Button
              onClick={handleLineConnect}
              className="bg-[#00B900] hover:bg-[#00A000] text-white w-full flex items-center justify-center gap-2"
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
            <Button
              variant="outline"
              onClick={() => setShowLineModal(false)}
            >
              後で設定する
            </Button>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            <h3 className="font-medium mb-2">連携手順:</h3>
            <ol className="list-decimal list-inside space-y-1">
              <li>上のボタンをタップしてLINEアプリを開く</li>
              <li>「追加」ボタンをタップして友だち追加</li>
              <li>メッセージ通知の受信設定を「オン」にする</li>
            </ol>
          </div>
        </DialogContent>
      </Dialog>

      {/* ヘッダー */}
      <div className="w-full p-4 flex items-center border-b">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/messages")}
          className="mr-2"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-semibold">チャット</h1>
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
            <div className="flex flex-col items-start text-xs text-gray-500 mt-1">
              <span>{formatRelativeTime(message.created_at)}</span>
              {message.user_id === user.uid && (
                <span>{message.read ? "既読" : "未読"}</span>
              )}
            </div>
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
