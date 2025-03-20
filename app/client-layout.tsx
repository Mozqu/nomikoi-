'use client'

import { usePathname } from "next/navigation"
import BottomNav from "@/components/bottom-nav"

const hideNavPaths = ["/", "/login", "/signup", "/register", "/register/acceptable_drinking_habit", "/register/way_of_drinking", "/register/favorite_alcohol", "/register/talking_stance", "/register/upload-profile-images", "/register/caution", "/register/drinking_character"]

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const shouldHideNav = hideNavPaths.includes(pathname)

  return (
    <>

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
    </>
  )
}
