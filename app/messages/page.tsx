"use client"

import { useEffect, useState } from "react"
import { collection, query, where, orderBy, getDocs } from "firebase/firestore"
import { auth, db } from "@/app/firebase/config"
import { onAuthStateChanged } from "firebase/auth"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useUser } from "@/hooks/users"
import { Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

interface MessageRoom {
  id: string
  user_ids: string[]
  created_at: string
}

interface MessageDisplay extends MessageRoom {
  partnerInfo: {
    name: string
    photoURL: string
    age: number
    location: string
  } | null
}

const calculateAge = (birthday: Timestamp | null | any): number | null => {
    if (!birthday) return null
    
    // Timestampオブジェクトかどうかをチェック
    if (typeof birthday.toDate !== 'function') {
        // 文字列の場合はDateオブジェクトに変換
        if (typeof birthday === 'string') {
        const date = new Date(birthday)
        if (isNaN(date.getTime())) return null
        const today = new Date()
        let age = today.getFullYear() - date.getFullYear()
        const m = today.getMonth() - date.getMonth()
        if (m < 0 || (m === 0 && today.getDate() < date.getDate())) {
            age--
        }
        return age
        }
        return null
    }
    
    const birthDate = birthday.toDate()
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--
    }
    return age
}

export default function MessagesPage() {
  const [user, setUser] = useState<any>(null)
  const [messageRooms, setMessageRooms] = useState<MessageDisplay[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const [partnerIds, setPartnerIds] = useState<string[]>([])

  // 各パートナーIDに対して個別のuseUserフックを使用
  const partner1Data = useUser(partnerIds[0] || '')
  const partner2Data = useUser(partnerIds[1] || '')
  // 必要に応じて追加

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const fetchMessageRooms = async () => {
      if (!user) return

      try {
        const roomsRef = collection(db, "message_rooms")
        const q = query(
          roomsRef,
          where('user_ids', 'array-contains', user.uid),
          orderBy("created_at", "desc")
        )

        console.log("Current user.uid:", user.uid)

        const querySnapshot = await getDocs(q)
        console.log("Query results:", querySnapshot.size)
        console.log("Raw docs:", querySnapshot.docs.map(doc => doc.data()))

        const allRooms = querySnapshot.docs.map(doc => {
          const data = doc.data()
          // Timestampを文字列に変換
          const created_at = data.created_at?.toDate?.() 
            ? data.created_at.toDate().toLocaleString('ja-JP')
            : ''

          return {
            id: doc.id,
            ...data,
            created_at: created_at,
            partnerInfo: null
          }
        }) as MessageDisplay[]
        console.log("Processed rooms:", allRooms)

        const uniquePartnerIds = Array.from(new Set(
          allRooms.map(room => room.user_ids.find(id => id !== user.uid) || '')
        )).filter(id => id !== '')
        setPartnerIds(uniquePartnerIds)

        setMessageRooms(allRooms)
      } catch (error) {
        console.error("メッセージルームの取得に失敗:", error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchMessageRooms()
    }
  }, [user])

  // パートナー情報が取得できたら、messageRoomsを更新
  useEffect(() => {
    if (user) {
      const updatedRooms = messageRooms.map(room => {
        const partnerId = room.user_ids.find(id => id !== user.uid) || ''
        let partnerData = null

        // パートナーデータを探す
        if (partnerId === partnerIds[0]) {
          partnerData = partner1Data.userData
        } else if (partnerId === partnerIds[1]) {
          partnerData = partner2Data.userData
        }
        // 必要に応じて追加
        console.log(partnerData)
        return {
          ...room,
          partnerInfo: partnerData ? {
            name: partnerData.name || '',
            photoURL: partnerData.photoURL || '/placeholder.svg',
            age: calculateAge(partnerData.birthday) || 0,
            location: partnerData.location || ''
          } : null
        }
      })

      if (JSON.stringify(updatedRooms) !== JSON.stringify(messageRooms)) {
        setMessageRooms(updatedRooms)
      }
    }
  }, [user, partner1Data, partner2Data, messageRooms, partnerIds])

  if (!user) {
    return <div className="p-4">ログインが必要です</div>
  }

  if (loading) {
    return <div className="p-4">読み込み中...</div>
  }

  console.log(messageRooms)

  return (
    <>
        {/* ヘッダー */}
        <div className="w-full p-2 flex justify-between items-center">
        {/* Back button */}
            <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md border border-white/10"
                >
                <ChevronLeft className="h-6 w-6" />
            </Button>


        
        </div>

        <div className="p-4 overflow-y-auto flex-1">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">メッセージ</h1>
            </div>

            {/* マッチング一覧 
            <div className="mb-8">
                <h2 className="text-sm text-gray-600 mb-4">マッチング</h2>
                <div className="flex gap-4 overflow-x-auto pb-4">
                {messageRooms.map(room => (
                    room.partnerInfo && (
                    <div key={room.id} className="flex flex-col items-center min-w-[80px]">
                        <div className="relative w-20 h-20">
                        <Image
                            src={room.partnerInfo.photoURL}
                            alt={room.partnerInfo.name}
                            fill
                            className="rounded-full object-cover"
                        />
                        </div>
                        <span className="text-sm mt-2">
                        {room.partnerInfo.age}歳 {room.partnerInfo.location}
                        </span>
                    </div>
                    )
                ))}
                </div>
            </div>
            */}

            {/* メッセージ一覧 */}
            <div className="space-y-4 w-full">
                {messageRooms.map(room => (
                room.partnerInfo && (
                    <div
                    key={room.id}
                    className="flex items-center gap-4cursor-pointer"
                    onClick={() => router.push(`/messages/${room.id}`)}
                    >
                    <div className="relative w-16 h-16">
                        <Image
                        src={room.partnerInfo.photoURL}
                        alt={room.partnerInfo.name}
                        fill
                        className="rounded-full object-cover"
                        />
                    </div>
                    <div className="flex-1 p-2">
                        <div className="flex justify-between items-center mb-1">
                        <span className="font-medium">
                            {room.partnerInfo.name} {room.partnerInfo.age}歳 {room.partnerInfo.location}
                        </span>
                        <span className="text-sm text-gray-500">
                            {room.created_at.split(' ')[0]}
                        </span>
                        </div>
                        <p className="text-sm pink-text truncate">
                            返信の有無などを表示
                        </p>
                    </div>
                    </div>
                )
                ))}
            </div>
        </div>
    </>
  )
}
