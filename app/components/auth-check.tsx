"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { auth } from "@/app/firebase/config"
import { onAuthStateChanged } from "firebase/auth"
import { Spinner } from "./Spinner"
const publicPaths = ["/", "/login", "/signup", "/register", "/register/drunk_personality", "/auth/verify"]

export default function AuthCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoading(false)
      

    })

    return () => unsubscribe()
  }, [router, pathname])

  // 認証チェック中はローディング表示（オプション）
  if (isLoading) {
    return <div><Spinner /></div>
  }

  return <>{children}</>
} 