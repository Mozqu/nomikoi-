"use client"

import { Suspense } from "react"
import { motion } from "framer-motion"
import UserProfile from "../components/profile/UserProfile"
import PersonalityChart from "../components/profile/PersonalityChart"
import FavoriteBars from "../components/profile/FavoriteBars"
import DrinkingPreferences from "../components/profile/DrinkingPreferences"
import { Skeleton } from "@/components/ui/skeleton"

const MotionDiv = motion.div

export default function MyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neon-blue/30 via-neon-purple/30 to-neon-pink/30 pb-24">
      <div className="container mx-auto p-4 space-y-6">
        <h1 className="text-4xl font-bold mb-6 neon-text shadow-neon-blue text-neon-blue">マイページ</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Suspense fallback={<Skeleton className="h-[200px] w-full bg-card" />}>
            <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <UserProfile />
            </MotionDiv>
          </Suspense>
          <Suspense fallback={<Skeleton className="h-[200px] w-full bg-card" />}>
            <MotionDiv
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <PersonalityChart />
            </MotionDiv>
          </Suspense>
          <Suspense fallback={<Skeleton className="h-[200px] w-full bg-card" />}>
            <MotionDiv
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <DrinkingPreferences />
            </MotionDiv>
          </Suspense>
          <Suspense fallback={<Skeleton className="h-[200px] w-full bg-card" />}>
            <MotionDiv
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <FavoriteBars />
            </MotionDiv>
          </Suspense>
        </div>
      </div>
    </div>
  )
}

