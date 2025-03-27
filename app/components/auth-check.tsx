"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { auth } from "@/app/firebase/config"
import { onAuthStateChanged } from "firebase/auth"

const publicPaths = ["/", "/login", "/signup", "/register", "/register/drunk_personality"]

export default function AuthCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoading(false)
      
      // 現在のパスがパブリックパスでなく、ユーザーが未認証の場合
      if (!user && !publicPaths.includes(pathname)) {
        console.error("Unauthorized access, redirecting to home")
        router.push("/")
      } else {
        console.error('=== userが存在する ===')
      }
    })

    return () => unsubscribe()
  }, [router, pathname])

  // 認証チェック中はローディング表示（オプション）
  if (isLoading) {
    return <div>Loading...</div>
  }

  return <>{children}</>
} 