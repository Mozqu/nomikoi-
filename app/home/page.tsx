"use client"

import { Home, Heart, MessageCircle, User as UserIcon, Star } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useEffect, useState, useCallback, useRef } from "react"
import { auth, db } from "@/app/firebase/config"
import type { QueryDocumentSnapshot, Timestamp } from "firebase/firestore"
import { useInView } from "react-intersection-observer"
import { collection, query, limit, getDocs, startAfter, orderBy } from "firebase/firestore"
import { useRouter } from 'next/navigation'
import { getDownloadURL } from "firebase/storage"
import { listAll } from "firebase/storage"
import { ref } from "firebase/storage"
import { getStorage } from "firebase/storage"

// User型を定義
interface User {
  id: string;
  name: string;
  photoURL: string;
  birthday: Timestamp | null;
  location?: string;
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

interface UserCardProps {
  user: User
  isNew?: boolean
}

const UserCard: React.FC<UserCardProps> = ({ user, isNew }) => {
  const router = useRouter()
  const age = calculateAge(user.birthday)
  console.log(user)
  const handleClick = () => {
    router.push(`/profile/${user.id}`)
  }

  const [imageUrls, setImageUrls] = useState<string[]>([]);

  useEffect(() => {
    const fetchImages = async () => {
        if (!user?.id) return;
        
        try {
            const storage = getStorage();
              const imagesRef = ref(storage, `profile-image/${user.id}`);
              const imagesList = await listAll(imagesRef);
            
            const urls = await Promise.all(
                imagesList.items.map(imageRef => getDownloadURL(imageRef))
            );
            
            setImageUrls(urls);
        } catch (error) {
            console.error('画像の取得に失敗しました:', error);
            // デフォルト画像を設定
            setImageUrls(['/OIP.jpeg']);
        }
    };
    
    fetchImages();
}, [user?.id]);
  
  return (
    <div 
      className="relative rounded-xl overflow-hidden aspect-[3/4] bg-white shadow cursor-pointer transition-transform hover:scale-105"

      onClick={handleClick}
    >
      <Image 
        src={imageUrls[0] || user.photoURL || "/placeholder.svg"}
        alt={user.name} 
        fill 
        className="object-cover"
      />
      
      {/* お気に入りボタン */}
      <div className="absolute top-2 right-2">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 bg-white/80 hover:bg-white shadow-md"
          onClick={(e) => {
            e.stopPropagation() // カードのクリックイベントを停止
            // お気に入りの処理をここに追加
          }}
        >
          <Star className="h-4 w-4" />
        </Button>
      </div>

      {/* NEWバッジ */}
      {isNew && (
        <div className="absolute top-2 left-2">
          <span className="px-2 py-1 text-xs font-semibold bg-pink-500 text-white rounded-full shadow-md">
            NEW
          </span>
        </div>
      )}

      {/* ユーザー情報 */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/60 to-transparent">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-white drop-shadow-lg">
              {user.name}
            </span>
            {age && (
              <span className="text-sm font-medium text-white/90 drop-shadow-lg">
                {age}歳
              </span>
            )}
          </div>
          {user.location && (
            <span className="text-xs text-white/90 drop-shadow-lg">
              {user.location}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// fetchUsers関数を追加
async function fetchUsers(lastUser: QueryDocumentSnapshot | null = null, limitCount = 10) {
  const usersRef = collection(db, "users")
  let q = query(usersRef, orderBy("createdAt", "desc"), limit(limitCount))
  
  if (lastUser) {
    q = query(usersRef, orderBy("createdAt", "desc"), startAfter(lastUser), limit(limitCount))
  }

  const snapshot = await getDocs(q)
  const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User))
  
  return {
    users,
    lastUser: snapshot.docs[snapshot.docs.length - 1] || null
  }
}

export default function DiscoverPage() {
  const [users, setUsers] = useState<User[]>([])
  const [newUsers, setNewUsers] = useState<User[]>([])
  const [lastUser, setLastUser] = useState<QueryDocumentSnapshot | null>(null)
  const [loading, setLoading] = useState(false)
  const [ref, inView] = useInView()
  const hasMoreUsers = useRef(true)

  const loadMoreUsers = useCallback(async () => {
    if (loading || !hasMoreUsers.current) return
    setLoading(true)
    try {
      const { users: fetchedUsers, lastUser: newLastUser } = await fetchUsers(lastUser)
      if (fetchedUsers.length === 0) {
        hasMoreUsers.current = false
      } else {
        // ユーザーIDで重複を排除
        const uniqueUsers = fetchedUsers.filter(newUser => 
          !users.some(existingUser => existingUser.id === newUser.id) &&
          !newUsers.some(existingUser => existingUser.id === newUser.id)
        )

        // First 3 unique users go to recommendations
        const recommendationUsers = uniqueUsers.slice(0, 3)
        // Rest go to new users
        const newUsersList = uniqueUsers.slice(3)

        setUsers(prev => [...prev, ...recommendationUsers])
        setNewUsers(prev => [...prev, ...newUsersList])
        setLastUser(newLastUser)
      }
    } catch (error) {
      console.error("Error loading more users:", error)
    } finally {
      setLoading(false)
    }
  }, [lastUser, loading, users, newUsers])

  useEffect(() => {
    if (inView && !loading && hasMoreUsers.current) {
      loadMoreUsers()
    }
  }, [inView, loading, loadMoreUsers])

  useEffect(() => {
    if (users.length === 0) {
      loadMoreUsers()
    }
  }, [users.length, loadMoreUsers])

  return (
    <div className="min-h-screen [--scroll-mt:9.875rem] lg:[--scroll-mt:6.3125rem]">
      <div className="max-w-lg mx-auto px-4 py-6">
        
        {/* あなたの好みかも 
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">あなたの好みかも</h2>
            <button className="text-gray-400">
              <span className="sr-only">Help</span>？
            </button>
          </div>
          <div className="overflow-x-auto flex gap-4 pb-4 snap-x snap-mandatory -mx-4 px-4">
            {users.map((user, index) => (
              <div key={`recommendation-${user.id}-${index}`} className="snap-start shrink-0 w-40">
                <UserCard user={user} />
              </div>
            ))}
          </div>
        </div>
        */}

        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">新しく登録したお相手</h2>
            <button className="text-gray-400">
              <span className="sr-only">Help</span>？
            </button>
          </div>
          <div className="overflow-x-auto flex gap-4 pb-4 snap-x snap-mandatory -mx-4 px-4">
            {newUsers.map((user, index) => (
              <div key={`new-${user.id}-${index}`} className="snap-start shrink-0 w-40">
                <UserCard user={user} isNew />
              </div>
            ))}
          </div>
        </div>
      </div>

      {loading && <div className="text-center py-4">Loading...</div>}
      {!loading && !hasMoreUsers.current && (
        <div className="text-center py-4 text-gray-500">これ以上ユーザーはいません</div>
      )}
      <div ref={ref} className="h-10" />
    </div>
  )
}

