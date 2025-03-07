"use client"

import { useState, useEffect, useId } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import ImageForm from "@/components/setting/image-form"
import { auth } from "@/app/firebase/config"

// 質問表示コンポーネント


export default function UploadProfileImages() {

    const router = useRouter()

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full flex flex-col h-[calc(100vh-100px)]"
    >
      <h1 className="p-4 text-2xl font-bold mt-6 mb-6">写真を登録しましょう</h1>

      <div className="flex-1 overflow-y-auto pb-24">
        <div className="flex flex-wrap gap-4">

            <ImageForm />

          <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/80 backdrop-blur-sm">
            <div className="container max-w-lg mx-auto">
              <Button
                onClick={async () => {
                    router.push(`/profile/${auth.currentUser?.uid}`)
                }}
                className="w-full h-14 text-lg neon-bg hover:from-pink-600 hover:to-purple-700"
              >
                次へ
              </Button>
            </div>
          </div>
        </div>

      </div>

    </motion.div>
  )
}
