'use client'

import { motion } from "framer-motion"
import { Wine, Heart, MessageCircle } from "lucide-react"

const features = [
  {
    icon: Wine,
    title: "気分マッチング",
    description: "今日の飲みたい気分に合わせて相手を見つける",
    color: "text-neon-blue",
  },
  {
    icon: Heart,
    title: "共通の興味",
    description: "お酒の好みや行きたいお店の雰囲気で相性の良い相手を探す",
    color: "text-neon-pink",
  },
  {
    icon: MessageCircle,
    title: "スムーズな会話",
    description: "AIが話題を提案し、会話を盛り上げる",
    color: "text-neon-purple",
  },
]

export default function FeaturesSection() {
  return (
    <section className="py-20 px-6 bg-cyber-dark bg-opacity-50">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            className="text-center p-6 rounded-lg bg-gradient-to-br from-gray-900 to-gray-800 shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: index * 0.2 }}
          >
            <feature.icon className={`w-16 h-16 mx-auto mb-4 ${feature.color} text-glow`} />
            <h3 className={`text-2xl font-bold mb-4 ${feature.color} text-glow`}>{feature.title}</h3>
            <p className="text-gray-300">{feature.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

