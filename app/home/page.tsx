"use client"

import { Home, Heart, MessageCircle, User as UserIcon, Star, Bell, SlidersHorizontal } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useEffect, useState, useCallback, useRef } from "react"
import { auth, db } from "../firebase/config"
import type { QueryDocumentSnapshot, Timestamp } from "firebase/firestore"
import { useInView } from "react-intersection-observer"
import { collection, query, limit, getDocs, startAfter, orderBy, where, getDoc, doc } from "firebase/firestore"
import { useRouter } from 'next/navigation'
import { getDownloadURL } from "firebase/storage"
import { listAll } from "firebase/storage"
import { ref } from "firebase/storage"
import { getStorage } from "firebase/storage"
import ProfileCardSmall from "@/components/profile/profile-card-small"
import LoadingSpinner from '@/app/components/LoadingSpinner'
import { Firestore } from "firebase/firestore"

// User型を定義
interface User {
  id: string;
  name: string;
  photoURL: string;
  birthday: Timestamp | null;
  location?: string;
  age: number;
  gender: string;
  createdAt: string;
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
            setImageUrls(['/placeholder-user.png']);
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

// 3日以内に登録したユーザーを取得する関数
async function fetchRecentUsers() {
  try {
    // 3日前の日時を計算
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    // usersコレクションへの参照
    const usersRef = collection(db, "users");
    
    // 3日以内に作成されたユーザーを取得するクエリ
    const q = query(
      usersRef,
      where("createdAt", ">=", threeDaysAgo)
    );
    
    // クエリを実行
    const snapshot = await getDocs(q);
    
    // 結果を配列に変換
    const recentUsers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`最近登録した${recentUsers.length}人のユーザーを取得しました`);
    return recentUsers;
    
  } catch (error) {
    console.error("最近のユーザー取得に失敗しました:", error);
    return [];
  }
}

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [recommendedUsers, setRecommendedUsers] = useState<User[]>([]);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      try {
        if (!auth?.currentUser) {
          router.push("/login");
          return;
        }

        if (!db) {
          throw new Error("Firestore is not initialized");
        }
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));

        if (!userDoc.exists()) {
          throw new Error("User data not found");
        }

        const userData = userDoc.data();

        // 最近のユーザーとおすすめユーザーを並行して取得
        const [recentResponse, recommendedResponse] = await Promise.all([
          fetch(`/api/users/recent?userId=${auth.currentUser.uid}&gender=${userData.gender}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store'
          }),
          fetch(`/api/users/recommended?userId=${auth.currentUser.uid}&gender=${userData.gender}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store'
          })
        ]);

        if (!recentResponse.ok || !recommendedResponse.ok) {
          throw new Error(`API error: ${!recentResponse.ok ? recentResponse.status : recommendedResponse.status}`);
        }

        const [recentUsers, recommendedUsers] = await Promise.all([
          recentResponse.json(),
          recommendedResponse.json()
        ]);

        setUserData(userData);
        setRecentUsers(recentUsers);
        setRecommendedUsers(recommendedUsers);
        setLoading(false);

      } catch (error) {
        console.error("Error fetching user data:", error);
        setError(error instanceof Error ? error.message : "データの取得に失敗しました。");
        setLoading(false);
      }
    };

    checkAuthAndFetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-y-auto" style={{ paddingBottom: '10rem' }}>

      {/* ヘッダー */}
      <div style={{height: '3rem'}} className="sticky top-0 z-10 container w-full px-4 py-2 bg-black/50 backdrop-blur-sm">
        <div className="flex justify-between items-center">
            <Image
              src="/header-logo.png"
              alt="logo"
              width={100}
              height={100}
              style={{
                height: '2.5rem',
                width: 'auto',
                objectFit: 'contain',
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
            >
              <SlidersHorizontal className="h-5 w-5" />
            </Button>
          </div>
      </div>


      <div className="container w-full px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">新規ユーザー</h1>
        <div className="relative">
          <div className="flex overflow-x-scroll gap-4 pb-4 no-scrollbar"
            style={{
              WebkitOverflowScrolling: 'touch',
            }}>
            <div className="flex gap-4">
              {recentUsers.map(user => (
                <div key={user.id} className="flex-none w-[160px]">
                  <ProfileCardSmall user={user} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container w-full px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">マッチしてるかも</h1>
        <div className="relative">
          <div className="flex overflow-x-scroll gap-4 pb-4 no-scrollbar"
            style={{
              WebkitOverflowScrolling: 'touch',
            }}>
            <div className="flex gap-4">
              {recommendedUsers.map(user => (
                <div key={user.id} className="flex-none w-[160px]">
                  <ProfileCardSmall user={user} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

