'use client'

import { usePathname } from "next/navigation"
import BottomNav from "@/components/bottom-nav"

const hideNavPaths = ["/", "/login", "/signup", "/register", "/register/acceptable_drinking_habit", "/register/way_of_drinking", "/register/favorite_alcohol"]

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const shouldHideNav = hideNavPaths.includes(pathname)

  return (
    <>
      {children}
      {!shouldHideNav && <BottomNav />}
    </>
  )
}
