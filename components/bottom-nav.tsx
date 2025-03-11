'use client'

import Link from "next/link"
import { Home, Heart, MessageCircle, User } from "lucide-react"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { auth } from "@/app/firebase/config"

export default function BottomNav() {
  const pathname = usePathname()
  const uid = auth.currentUser?.uid

  return (
    <nav className="left-0 right-0 px-2 pb-2 z-30">
      <div className="flex justify-around items-center max-w-md mx-auto backdrop-blur-md rounded-full px-4 py-2 border border-white/10 shadow-[0_0_20px_rgba(111,44,255,0.15)]" style={{ background: 'rgba(0, 0, 0, 0.5)' }}>
        <Link href="/home">
          <Button variant="ghost" className={`text-[${pathname === '/home' ? '#ff2e93' : '#c2b5ff'}] hover:text-[#ff2e93]/80 hover:bg-white/5`}>
            <motion.div whileHover={{ scale: 1.1 }}>
              <Home className="w-6 h-6" />
            </motion.div>
          </Button>
        </Link>
        <Link href="/interested">
          <Button variant="ghost" className={`text-[${pathname === '/interested' ? '#ff2e93' : '#c2b5ff'}] hover:text-white hover:bg-white/5`}>
            <motion.div whileHover={{ scale: 1.1 }}>
              <Heart className="w-6 h-6" />
            </motion.div>
          </Button>
        </Link>
        <Link href="/messages">
          <Button variant="ghost" className={`text-[${pathname === '/messages' ? '#ff2e93' : '#c2b5ff'}] hover:text-white hover:bg-white/5`}>
            <motion.div whileHover={{ scale: 1.1 }}>
              <MessageCircle className="w-6 h-6" />
            </motion.div>
          </Button>
        </Link>
        <Link href={`/profile/${uid}`}>
          <Button variant="ghost" className={`text-[${pathname === '/profile' ? '#ff2e93' : '#c2b5ff'}] hover:text-white hover:bg-white/5`}>
            <motion.div whileHover={{ scale: 1.1 }}>
              <User className="w-6 h-6" />
            </motion.div>
          </Button>
        </Link>
      </div>
    </nav>
  )
} 