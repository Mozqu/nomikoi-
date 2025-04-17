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

interface MessageRoom {
  id: string
  type: 'group' | 'direct'
  permission: boolean
  user_ids: string[]
  submitBy?: string
  submitByUser?: {
    uid: string
    name: string
    photo: string
  }
  rejected?: boolean
  groupData?: any
  groupId?: string
  created_at?: any
  updated_at?: any
  visitedUsers?: Record<string, any>
}

export default function ChatRoom({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [user, setUser] = useState<any>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [hasLineConnection, setHasLineConnection] = useState<boolean | null>(null)
  const [showLineModal, setShowLineModal] = useState(true)
  const [room, setRoom] = useState<MessageRoom | null>(null)
  const messagesEndRef = useRef<null | HTMLDivElement>(null)
  const router = useRouter()
  
  // 認証状態の監視
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth!, (user) => {
      if (!user) {
        router.push("/login")
        return
      } else {

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
        setHasLineConnection(!!userData?.lineId)
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
    if (!newMessage.trim() || !user || isSending) return
    
    setIsSending(true)

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

        if (partnerData) {
          console.log('partnerData', partnerData.uid)

          // パートナーがLINE連携済みの場合、通知を送信
          console.log("連携済みユーザー", partnerData.uid)
          await fetch('/api/line-message', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: newMessage,
              partnerId: partnerData?.uid,
              senderName: userName,
              messageRoomId: id
            })
          })
          
        }
      }

      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setIsSending(false)
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

  // メッセージルーム情報の取得
  useEffect(() => {
    if (!id) return

    const fetchRoomData = async () => {
      try {
        console.log("Fetching room data for ID:", id)
        const roomDoc = await getDoc(doc(db!, "message_rooms", id))
        
        if (roomDoc.exists()) {
          const roomData = roomDoc.data()
          console.log("Room data:", roomData)
          
          let submitByUser = undefined
          let groupData = undefined
          
          if (roomData.submitBy) {
            console.log("Fetching submitter data for:", roomData.submitBy)
            const userDoc = await getDoc(doc(db!, "users", roomData.submitBy))
            
            if (userDoc.exists()) {
              const userData = userDoc.data()
              console.log("User data:", userData)
              submitByUser = {
                uid: roomData.submitBy,
                name: userData.name || "匿名ユーザー",
                photo: userData.photos?.[0]?.url || "/placeholder.svg"
              }

              // groupデータを取得
              const groupsRef = collection(db!, "groups")
              const q = query(groupsRef, where("createdBy", "==", roomData.submitBy))
              const groupSnapshot = await getDocs(q)
              
              if (!groupSnapshot.empty) {
                const groupDoc = groupSnapshot.docs[0]
                groupData = {
                  id: groupDoc.id,
                  ...groupDoc.data()
                }
                console.log("Group data:", groupData)
              }
            }
          }

          setRoom({
            id: roomDoc.id,
            type: roomData.type || 'direct',
            permission: roomData.permission || false,
            user_ids: roomData.user_ids || [],
            submitBy: roomData.submitBy,
            submitByUser,
            groupData,
            groupId: roomData.groupId,
            created_at: roomData.created_at,
            updated_at: roomData.updated_at,
            visitedUsers: roomData.visitedUsers,
            rejected: roomData.rejected
          } as MessageRoom)
        }
      } catch (error) {
        console.error("Error fetching room data:", error)
      }
    }

    fetchRoomData()
  }, [id])

  // グループチャットの許可を更新
  const handleAcceptChat = async () => {
    if (!id || !room?.submitBy) return
    try {
      const roomRef = doc(db!, "message_rooms", id)
      const roomDoc = await getDoc(roomRef)
      
      if (roomDoc.exists()) {
        const roomData = roomDoc.data()
        const currentUserIds = roomData.user_ids || []
        const updatedUserIds = currentUserIds.includes(room.submitBy) 
          ? currentUserIds 
          : [...currentUserIds, room.submitBy]
        
        await updateDoc(roomRef, {
          permission: true,
          rejected: false,
          user_ids: updatedUserIds
        })

        // roomの状態を更新
        setRoom(prevRoom => ({
          ...prevRoom!,
          permission: true,
          user_ids: updatedUserIds,
          rejected: false
        }))

        // 承認メッセージを送信
        const messagesRef = collection(db!, "message_rooms", id, "messages")
        await addDoc(messagesRef, {
          text: "チャットを解放しました",
          created_at: serverTimestamp(),
          user_id: user.uid,
          user_name: user.displayName || "ユーザー",
          user_photo: user.photoURL || "/placeholder.svg",
          read: false
        })
        
        console.log("チャットを承認し、ユーザーを追加しました")
      }
    } catch (error) {
      console.error("チャットの許可に失敗:", error)
    }
  }

  const handleRejectChat = async () => {
    const roomRef = doc(db!, "message_rooms", id)
    const roomDoc = await getDoc(roomRef)
    if (roomDoc.exists()) {
      const roomData = roomDoc.data()
      await updateDoc(roomRef, {
        rejected: true
      })
    }
    
    router.push("/messages")
  }

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

  // グループチャットで許可が必要な場合の表示
  if (room?.type === "group" && !room.permission) {
    console.log("Rendering group invitation UI with room data:", room)
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 space-y-6">
        {room.submitByUser && (
          <div className="flex items-center space-y-2  relative">
            <div className="relative w-20 h-20 bg-gray-100 rounded-xl overflow-hidden">
              <Link href={`/profile/${room.submitByUser.uid}`}>
                <Image
                  src={room.submitByUser.photo}
                  alt={room.submitByUser.name}
                  fill
                  className="object-cover"
                  priority
                />
              </Link>
            </div>

            <div className="flex flex-col gap-2 px-4">
              {room.groupData && (
                <>
                  <div className="flex flex-col">
                    <h3 className="font-semibold text-lg">{room.groupData.name}</h3>
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap gap-2 absolute top-[-1rem] right-[-1rem]">
                        {room.groupData.preferences?.favoriteArea?.map((area: string, index: number) => (
                          <span
                            key={index}
                            className="bg-gray-700 text-gray-300 px-2 py-1 rounded-full text-sm"
                          >
                            {area}
                          </span>
                        )) || <span className="text-sm text-gray-400">未設定</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <p className="text-sm text-gray-400">{room.groupData.description}</p>
                  </div>
                </>
              )}
              <div className="flex items-center gap-2">
                <p>{room.submitByUser.name}</p>
                <p className="text-gray-500">からの招待</p>
              </div>
            </div>
          </div>
        )}
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold"
            style={{
              color: room.rejected ? "red" : ""
            }}
          >{room.rejected ? "お誘いを拒否しています。" : "グループにお誘いが届きました"}</h2>
          {room.rejected && <p className="text-gray-500">※相手には通知されません</p>}
          <p className="text-gray-500">チャットを解放しますか？</p>
        </div>
        <div className="flex gap-4">
          <Button
            onClick={handleAcceptChat}
            className="bg-sky hover:bg-sky/90 text-white px-6"
          >
            承認する
          </Button>
          <Button
            variant="outline"
            onClick={handleRejectChat}
            className="border-white/10 px-6"
            style={{
              color: room.rejected ? "red" : ""
            }}
          >
            拒否する
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto  relative">
      {/* LINEモーダル 
      {!hasLineConnection && (
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
      )}
      */}

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
            className="flex-1 rounded-full border-none"
            disabled={isSending}
            style={{
              outline: "none",
              boxShadow: "none",
              background: "rgba(255, 255, 255, 0.05)"
            }}
          />
          <Button 
            className="rounded-full neon-bg" 
            type="submit"
            disabled={isSending}
          >
            <Send className={isSending ? "opacity-50" : ""} />
          </Button>
        </div>
      </form>
    </div>
  )
}
