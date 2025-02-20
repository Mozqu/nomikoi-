'use client'

import type { User } from "@/types/user"
import Image from "next/image"
import { motion } from "framer-motion"
import { Wine } from "lucide-react"

interface UserCardProps {
  user: User
}

export default function UserCard({ user }: UserCardProps) {
  return (
    <motion.div
      className="bg-gray-900/80 rounded-lg overflow-hidden shadow-lg neon-glow-card"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="relative h-96">
        <Image
          src={user.imageUrl}
          alt={user.name}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
          <h2 className="text-2xl font-bold text-white mb-1 neon-text-white">
            {user.name}, {user.age}
          </h2>
          <div className="flex items-center text-neon-blue neon-text-blue">
            <Wine size={16} className="mr-2" />
            <span>{user.drinkPreference}</span>
          </div>
        </div>
      </div>
      <div className="p-4 bg-gray-800/80">
        <p className="text-gray-300 neon-text-gray">{user.bio}</p>
      </div>
    </motion.div>
  )
}

