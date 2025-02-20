"use client"

import { useState, useEffect } from "react"
import { motion, type PanInfo, useAnimation } from "framer-motion"
import type { User } from "@/types/user"
import UserCard from "@/components/UserCard"
import { Button } from "@/components/ui/button"
import { Heart, X } from "lucide-react"

const mockUsers: User[] = [
  {
    id: "1",
    name: "田中太郎",
    age: 25,
    bio: "日本酒が大好きです！",
    imageUrl: "/images/user1.jpg",
    drinkPreference: "日本酒"
  },
  {
    id: "2",
    name: "佐藤 太郎",
    age: 28,
    bio: "クラフトビール好きです。おすすめのお店を教えてください！",
    imageUrl: "/placeholder.svg?height=400&width=300",
    drinkPreference: "クラフトビール",
  },
  {
    id: "3",
    name: "鈴木 美咲",
    age: 23,
    bio: "カクテルが得意です。一緒に新しいお店を開拓しませんか？",
    imageUrl: "/placeholder.svg?height=400&width=300",
    drinkPreference: "カクテル",
  },
]

export default function MatchingPage() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState<"left" | "right" | null>(null)
  const controls = useAnimation()

  const currentUser = mockUsers[currentIndex]

  useEffect(() => {
    controls.start({ x: 0, opacity: 1 })
  }, [controls])

  const handleSwipe = (info: PanInfo) => {
    if (info.offset.x > 100) {
      setDirection("right")
      controls.start({ x: "100%", opacity: 0 })
    } else if (info.offset.x < -100) {
      setDirection("left")
      controls.start({ x: "-100%", opacity: 0 })
    }
  }

  const handleSwipeComplete = () => {
    if (direction) {
      if (direction === "right") {
        console.log("Liked:", currentUser.name)
      } else {
        console.log("Passed:", currentUser.name)
      }
      setCurrentIndex((prevIndex) => (prevIndex + 1) % mockUsers.length)
      setDirection(null)
    }
  }

  const handleButtonClick = (swipeDirection: "left" | "right") => {
    setDirection(swipeDirection)
    controls
      .start({
        x: swipeDirection === "left" ? "-100%" : "100%",
        opacity: 0,
        transition: { duration: 0.3 },
      })
      .then(handleSwipeComplete)
  }

  return (
    <div className="min-h-screen bg-cyber-dark flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-cyber-grid opacity-20"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/30 via-neon-purple/30 to-neon-pink/30"></div>
      <div className="absolute inset-0 animate-pulse">
        <div className="absolute inset-0 bg-neon-blue/5 blur-3xl"></div>
        <div className="absolute inset-0 bg-neon-purple/5 blur-3xl"></div>
        <div className="absolute inset-0 bg-neon-pink/5 blur-3xl"></div>
      </div>
      <div className="w-full max-w-md relative z-10">
        <motion.div
          key={currentUser.id}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={(e, info) => handleSwipe(info)}
          animate={controls}
          initial={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          onAnimationComplete={handleSwipeComplete}
          className="cursor-grab active:cursor-grabbing"
        >
          <UserCard user={currentUser} />
        </motion.div>
      </div>
      <div className="flex justify-center mt-8 space-x-4 z-10">
        <Button
          onClick={() => handleButtonClick("left")}
          className="bg-red-500 hover:bg-red-600 text-white rounded-full p-4 transition-all duration-300 ease-in-out transform hover:scale-110 neon-glow-red"
        >
          <X size={24} />
        </Button>
        <Button
          onClick={() => handleButtonClick("right")}
          className="bg-green-500 hover:bg-green-600 text-white rounded-full p-4 transition-all duration-300 ease-in-out transform hover:scale-110 neon-glow-green"
        >
          <Heart size={24} />
        </Button>
      </div>
    </div>
  )
}

