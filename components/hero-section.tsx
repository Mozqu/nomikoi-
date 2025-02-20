'use client'

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Link from 'next/link'

export default function HeroSection() {
  return (
    <section className="py-20 px-6 text-center relative overflow-hidden">
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
      >
        <div className="absolute inset-0 bg-neon-gradient from-neon-blue via-neon-purple to-neon-pink opacity-20"></div>
      </motion.div>
      <motion.h1
        className="text-5xl md:text-7xl font-bold mb-6 text-neon-blue text-glow relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        飲みたい気分で
        <br />
        新しい出会いを
      </motion.h1>
      <motion.p
        className="text-xl md:text-2xl mb-8 text-neon-pink text-glow relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        あなたの気分に合わせて
        <br />
        最適な飲み友達をマッチング
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="relative z-10"
      >
        <Link
          href="/matching"
          className="inline-flex items-center justify-center rounded-md bg-neon-blue px-8 py-3 text-lg font-medium text-white shadow-lg hover:bg-neon-blue/80 hover:shadow-neon-blue/50 transition-all duration-300"
        >
          今すぐ始める
        </Link>
      </motion.div>
    </section>
  )
}

