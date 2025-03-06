"use client"
import { useState, useEffect } from "react"
import { ChevronLeft, Settings } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { doc, getDoc } from "firebase/firestore"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { db } from "@/app/firebase/config"
import { useParams, useRouter } from "next/navigation"
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts"
import { auth } from "@/app/firebase/config"
import { LikeAction } from "@/components/like-action"
import ProfileCard from "@/components/profile/profile-card"

interface ProfileData {
  name: string
  age: number
  gender: string
  height: string
  about: string
  interests: string[]
  favoriteBars: string[]
  imageUrl: string,
  personalityTraits: {
    name: string
    value: number
  }[]
}

const profileData: ProfileData = {
  name: "Yuki",
  age: 24,
  gender: "女性",
  height: "165 cm",
  about: "新しい人と出会うのが好きです。お酒を飲みながら楽しい会話ができたらいいなと思います。",
  interests: ["ダンス", "料理", "ジャズ", "映画", "時々飲む"],
  favoriteBars: ["Bar Neon", "Space Lab"],
  imageUrl: "/persona/men/restaurant_owner.jpg",
  personalityTraits: [
    { name: "外向性", value: 80 },
    { name: "協調性", value: 90 },
    { name: "勤勉性", value: 70 },
    { name: "創造性", value: 85 },
    { name: "冒険心", value: 75 },
  ]
}

function calculateAge(birthday: any) {
  if (!birthday) return null;
  
  let birthDate;
  try {
    // Firestoreのタイムスタンプの場合
    if (birthday.toDate) {
      birthDate = birthday.toDate();
    } 
    // 通常の日付文字列の場合
    else {
      birthDate = new Date(birthday);
    }

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  } catch (error) {
    console.error('誕生日の計算エラー:', error);
    return null;
  }
}

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const [userData, setUserData] = useState<any>(null)
  const currentUserId = auth?.currentUser?.uid
  const isOwnProfile = params.id === currentUserId

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userRef = doc(db, "users", params.id as string)
        const userDoc = await getDoc(userRef)
        if (userDoc.exists()) {
          setUserData({ id: userDoc.id, ...userDoc.data() })
        }
      } catch (error) {
        console.error("ユーザー情報の取得に失敗しました:", error)
      }
    }

    fetchUser()
  }, [params.id])

  if (!userData) return <div>Loading...</div>

  // データ構造を確認するデバッグログを追加
  console.log('Profile Data:', userData?.answers?.favorite_alcohol);

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

        {/* プロフィール編集ボタン */}
        {isOwnProfile && (
          <a href="/settings">
            <Button
              variant="ghost"
              size="icon"
              className="z-20 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md"
          >
            <Settings className="h-6 w-6" />
            </Button>
          </a>
        )}
      </div>

      {/* プロフィール画像 */}
      <div className="w-full p-2 flex-1 overflow-hidden">
        <ProfileCard 
          userData={userData}
          isOwnProfile={isOwnProfile}
        />
      </div>
    </>
  )
}



