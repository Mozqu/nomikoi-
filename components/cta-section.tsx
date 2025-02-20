'use client'

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

export default function CTASection() {
  return (
    <section className="py-20 px-6 text-center bg-cyber-dark bg-opacity-70 relative overflow-hidden">
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
      >
        <div className="absolute inset-0 bg-neon-gradient from-neon-pink via-neon-purple to-neon-blue opacity-20"></div>
      </motion.div>
      <motion.h2
        className="text-4xl md:text-5xl font-bold mb-6 text-neon-blue text-glow relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        新しい飲み友達との
        <br />
        出会いを見つけよう
      </motion.h2>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative z-10"
      >
        <Button 
          className="bg-neon-blue hover:bg-neon-blue/80 text-white text-lg py-6 px-10 rounded-full shadow-lg hover:shadow-neon-blue/50 transition-all duration-300"
        >
          アプリを始める
        </Button>
      </motion.div>
    </section>
  )
}

