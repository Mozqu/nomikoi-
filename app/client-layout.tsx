'use client'

import { usePathname, useRouter } from "next/navigation"
import BottomNav from "@/components/bottom-nav"
import { useEffect, useState } from "react"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "./firebase/config"
import TodaysFeeling from "@/components/home/TodaysFeeling"
import { useAuth } from "./hooks/useAuth"

const hideNavPaths = ["/", "/login", "/signup", "/register", "/register/acceptable_drinking_habit", "/register/way_of_drinking", "/register/favorite_alcohol", "/register/talking_stance", "/register/upload-profile-images", "/register/caution", "/register/drinking_character", "/register/drinkingTags", "/register/hobbyTags", "/register/drinking_habit", "/register/recommend_drinking_character"]

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  console.log('=== client-layout ===')
  const pathname = usePathname()
  const router = useRouter()
  const shouldHideNav = hideNavPaths.includes(pathname)
  const [isRegistrationComplete, setIsRegistrationComplete] = useState(false)
  const { isLoading, isAuthenticated } = useAuth()

  useEffect(() => {
    const checkRegistrationStatus = async () => {
      // ログイン関連ページではチェックをスキップ
      if (pathname === '/login' || pathname === '/signup' || pathname === '/' || pathname === '/auth/verify' || pathname === '/adminLogin' || pathname === '/adminLogin/signup' || pathname === '/register/recommend_drinking_character' || pathname === '/register/drinking_character' || pathname === '/register/character_confirmation') return
      if (!auth?.currentUser || !db) return

      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid))
        
        // ユーザードキュメントが存在しない場合
        if (!userDoc.exists() && pathname !== '/register/caution') {
          console.log('=== userドキュメントが存在しません ===')
          router.push("/register/caution")
          return
        } else {
          setIsRegistrationComplete(true)
        }

        // ユーザードキュメントが存在する場合の各種チェック
        const userData = userDoc.data()
        const wayOfDrinking = userData?.answers?.way_of_drinking || []
        const favoriteAlcohol = userData?.answers?.favorite_alcohol || []

        if (pathname !== '/register/caution' && pathname !== '/register' && pathname !== '/register/way_of_drinking' && pathname !== '/register/favorite_alcohol') {
          console.log('registerページではない', pathname)
        
          // 各状態に応じたリダイレクト（該当ページ以外の場合のみ）
          if (!userData?.agreement && pathname !== '/register/caution') {
            console.log('===  agreementがfalse ===')
            router.push("/register/caution")
          } else if (!userData?.profileCompleted && pathname !== '/register') {
            console.log('=== profileCompletedがfalse ===')
            router.push("/register")
          } else if (wayOfDrinking.length === 0 && pathname !== '/register/way_of_drinking') {
            console.log('=== wayOfDrinkingが0 ===')
            router.push("/register/way_of_drinking")
          } else if (favoriteAlcohol.length === 0 && pathname !== '/register/favorite_alcohol') {
            console.log('=== favoriteAlcoholが0 ===')
            router.push("/register/favorite_alcohol")
          }
        }
      } catch (error) {
        console.error("登録状態の確認に失敗しました:", error)
      }
    }

    console.log('=== isRegistrationComplete ===', isRegistrationComplete)
    console.log('=== pathname ===', pathname, '=== shouldHideNav ===', shouldHideNav)

    checkRegistrationStatus()
  }, [pathname, router, auth?.currentUser])

  return (
    <>
      {isRegistrationComplete ? (
        <div className="w-full h-screen flex flex-col "
          style={
            {
              height: "100svh",
            } 
          }
        >
        <div id="content" className="flex-1 flex flex-col overflow-hidden">
          {children}
        </div>

        <div id="nav-container" className="z-10 sticky bottom-0">
          {!shouldHideNav && <BottomNav />}
          {!shouldHideNav && pathname === '/home' && <TodaysFeeling />}

        </div>
      </div>
      ) : (
        <div>
          <div id="content" className="flex-1 flex flex-col overflow-hidden" style={{
            height: "100svh",
          }}>
            {children}
          </div>
        </div>
      )}
    </>
  )
}
