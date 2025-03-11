"use client"

import { useEffect, useState } from "react"
import { collection, getDocs, orderBy, query } from "firebase/firestore"
import { auth, db } from "@/app/firebase/config"
import { onAuthStateChanged } from "firebase/auth"
import { fetchUserImage } from "@/hooks/fetch-image"
import Image from "next/image"
import { useUser } from "@/hooks/users"
import ProfileCardSmall from "@/components/profile/profile-card-small"

interface Like {
  id: string
  target_id: string
  uid: string
  type: string
  created_at: Date
}

interface User {
  id: string
  name: string
  photoURL: string
  birthday: Date | null
  location: string
}

// いいねの各アイテムのコンポーネント
const LikeItem = ({ like }: { like: Like }) => {
  const { userData, loading } = useUser(like.uid)

  if (loading || !userData) {
    return <div className="w-[180px] h-[240px] bg-gray-200 animate-pulse rounded-xl" />
  }

  // userDataを正しい形式に変換
  const formattedUser: User = {
    id: like.uid,
    name: userData.name || '',
    photoURL: userData.photoURL || '',
    birthday: userData.birthday || null,
    location: userData.location || ''
  }

  return <ProfileCardSmall user={formattedUser} />
}

export default function InterestedPage() {
  const [user, setUser] = useState<any>(null)
  const [likes, setLikes] = useState<Like[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      console.log("Current user:", user?.uid)
    })

    return () => unsubscribe()
  }, [])

  const fetchLikes = async () => {
    if (!user) return

    try {
      const likesRef = collection(db, "user_likes")
      const q = query(
        likesRef,
        orderBy("created_at", "desc")
      )

      const querySnapshot = await getDocs(q)
      console.log("Total documents:", querySnapshot.size)

      const allLikes = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate()
      })) as Like[]

      const filteredLikes = allLikes.filter(like => like.target_id === user.uid)
      console.log("Filtered likes:", filteredLikes)
      setLikes(filteredLikes)
    } catch (error) {
      console.error("いいね一覧の取得に失敗:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchLikes()
    }
  }, [user])

  if (!user) {
    return <div className="p-4">ログインが必要です</div>
  }

  if (loading) {
    return <div className="p-4">読み込み中...</div>
  }

  return (
    <div className="p-2 overflow-y-auto">
      <h1 className="text-2xl font-bold mb-4">興味を持たれたユーザー</h1>
      
      {likes.length === 0 ? (
        <p>まだいいねはありません</p>
      ) : (
        <div className="flex flex-wrap gap-4">
          {likes.map(like => (
              <LikeItem key={like.id} like={like} />
          ))}
        </div>
      )}
    </div>
  )
}
