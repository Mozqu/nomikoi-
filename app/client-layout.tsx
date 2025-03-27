'use client'

import { usePathname, useRouter } from "next/navigation"
import BottomNav from "@/components/bottom-nav"
import { useEffect, useState } from "react"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "./firebase/config"

const hideNavPaths = ["/", "/login", "/signup", "/register", "/register/acceptable_drinking_habit", "/register/way_of_drinking", "/register/favorite_alcohol", "/register/talking_stance", "/register/upload-profile-images", "/register/caution", "/register/drinking_character"]

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

  useEffect(() => {
    const checkRegistrationStatus = async () => {
      // ログイン関連ページではチェックをスキップ
      if (pathname === '/login' || pathname === '/signup' || pathname === '/') return
      if (!auth?.currentUser || !db) return

      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid))
        
        // ユーザードキュメントが存在しない場合
        if (!userDoc.exists() && pathname !== '/register/caution') {
          router.push("/register/caution")
          return
        }

        // ユーザードキュメントが存在する場合の各種チェック
        const userData = userDoc.data()
        const wayOfDrinking = userData?.answers?.way_of_drinking || []
        const favoriteAlcohol = userData?.answers?.favorite_alcohol || []

        // 各状態に応じたリダイレクト（該当ページ以外の場合のみ）
        if (!userData?.profileCompleted && pathname !== '/caution') {
          router.push("/caution")
        } else if (wayOfDrinking.length === 0 && pathname !== '/way_of_drinking') {
          router.push("/way_of_drinking")
        } else if (favoriteAlcohol.length === 0 && pathname !== '/favorite_drinking') {
          router.push("/favorite_drinking")
        }
      } catch (error) {
        console.error("登録状態の確認に失敗しました:", error)
      }
    }

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
        </div>
      </div>
      ) : (
        <div>
          <div id="content" className="flex-1 flex flex-col overflow-hidden">
            {children}
          </div>
        </div>
      )}
    </>
  )
}
