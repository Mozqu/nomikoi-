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
  const currentUserId = auth.currentUser?.uid
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

  return (
    <div className="h-screen relative">

        <div className="fixed left-0 right-0 z-30">
            <LikeAction targetId={params.id as string} />
        </div>
      {/* Fixed image container */}
      <div className="fixed inset-0">
        <Image
          src={profileData.imageUrl || "/persona/women/sampleWoman.jpeg"}
          alt={profileData.name}
          fill
          className="object-cover"
          priority
        />
        <div className="fixed inset-0 " />

      </div>

      {/* Back button */}
      <Link href="/discover">
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-20 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md border border-white/10"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
      </Link>

      {/* プロフィール編集ボタン */}
      {isOwnProfile && (
        <Link href="/settings">
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-4 right-4 z-20 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md"
          >
            <Settings className="h-6 w-6" />
          </Button>
        </Link>
      )}

      {/* Scrollable content */}
      <div className="inset-x-0 bottom-0 z-10 " style={{ marginTop: "80vh" }}>
        <motion.div 
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="h-full overflow-y-auto rounded-t-[2.5rem] neon-bg text-white border-t border-white/10 pb-[10rem] "
          style={{
            boxShadow: "0 -10px 30px rgba(111, 44, 255, 0.1)",
            overflow: "visible"
          }}
        >
          {/* Like/Dislike buttons */}

          
          <div className="px-6 py-8 space-y-6 flex flex-col gap-4 ">
            <h1 className="w-full text-2xl font-bold">
              {userData?.name || "Loading..."} (
              {calculateAge(userData?.birthday) || ""}
              )
            </h1>

            <div className="flex gap-4">
              {/* ユーザー情報 */}
              <div className="space-y-4 w-1/2">
                <div className="flex gap-2">
                  <Badge
                    variant="secondary"
                    className="text-white border-white/20 bg-white/5"
                  >
                    {userData?.gender || "Loading..."}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="text-white border-white/20 bg-white/5"
                  >
                    {profileData.height}
                  </Badge>
                </div>
              </div>

              {/* 性格チャート */}
              <section className="space-y-3 w-1/2">
                <div className="w-full h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="60%" data={profileData.personalityTraits}>
                      <PolarGrid stroke="#6f2cff" />
                      <PolarAngleAxis dataKey="name" tick={{ fill: "#c2b5ff", fontSize: 10 }} />
                      <Radar name="性格" dataKey="value" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.6} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </div>

            {/* 自己紹介 */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">自己紹介</h2>
              <p className="text-[#c2b5ff] leading-relaxed">{userData?.bio || "Loading..."}</p>
            </section>

            {/* 好きなお酒 */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold">好きなお酒</h2>
              <div className="flex flex-wrap gap-2">
                {userData?.drunk_personality?.alcoholPreferences?.favorites?.map((interest: string) => (
                  <Badge
                    key={interest}
                    variant="secondary"
                    className="text-white border-white/20 bg-white/5"
                  >
                    {interest}
                  </Badge>
                )) || <p className="text-[#c2b5ff]">データがありません</p>}
              </div>
            </section>

            {/* 苦手なお酒 */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold">苦手なお酒</h2>
              <div className="flex flex-wrap gap-2">
                {userData?.drunk_personality?.alcoholPreferences?.dislikes?.map((interest: string) => (
                  <Badge
                    key={interest}
                    variant="secondary"
                    className="text-white border-white/20 bg-white/5"
                  >
                    {interest}
                  </Badge>
                )) || <p className="text-[#c2b5ff]">データがありません</p>}
              </div>
            </section>

            {/* お気に入りのバー */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold">よく飲むお店</h2>
              <div className="flex flex-wrap gap-2">
                {userData?.drinking_location_preference?.map((bar: string) => (
                  <Badge
                    key={bar}
                    variant="outline"
                    className="text-white border-white/20 bg-white/5"
                  >
                    {bar}
                  </Badge>
                )) || <p className="text-[#c2b5ff]">データがありません</p>}
              </div>
            </section>

          </div>
        </motion.div>
      </div>


    </div>
  )
}


