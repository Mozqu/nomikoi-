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
  const pathname = usePathname()
  const router = useRouter()
  const shouldHideNav = hideNavPaths.includes(pathname)
  const [isRegistrationComplete, setIsRegistrationComplete] = useState(false)

  useEffect(() => {
    const checkRegistrationStatus = async () => {
      if (!auth?.currentUser || !db) return

      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid))
        if (!userDoc.exists()) return

        const userData = userDoc.data()
        const isRegistrationComplete = userData.profileCompleted && userData.drinkingProfileCompleted && userData.agreement

        if (!isRegistrationComplete && !pathname.startsWith('/register') && !pathname.startsWith('/login') && !pathname.startsWith('/signup') && pathname !== "/") {
          setIsRegistrationComplete(false)
          router.push("/register/caution")
        } else {
          setIsRegistrationComplete(true)
        }
      } catch (error) {
        console.error("登録状態の確認に失敗しました:", error)
      }
    }

    checkRegistrationStatus()
  }, [pathname, router])

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
