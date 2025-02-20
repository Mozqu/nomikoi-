"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function GenderSelectionPage() {
  const [gender, setGender] = useState<string>("")

  return (
    <div className="min-h-screen bg-black text-white flex flex-col px-4 pt-8">
      {/* Progress Bar */}
      <div className="w-full mb-12">
        <div className="relative w-full h-1 bg-gray-600 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "25%" }}
            transition={{ duration: 0.5 }}
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-pink-500 to-purple-600"
          />
        </div>
        <div className="text-center text-sm mt-2 text-gray-400">1/4</div>
      </div>

      {/* Header */}
      <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold mb-8">
        性別を教えてください
      </motion.h1>

      {/* Gender Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex-1"
      >
        <RadioGroup value={gender} onValueChange={setGender} className="space-y-4">
          <div className="flex items-center space-x-4 rounded-lg border-2 border-gray-800 p-4 hover:bg-white/5 transition-colors">
            <RadioGroupItem value="male" id="male" />
            <Label htmlFor="male" className="text-lg flex-1 cursor-pointer">
              男性
            </Label>
          </div>
          <div className="flex items-center space-x-4 rounded-lg border-2 border-gray-800 p-4 hover:bg-white/5 transition-colors">
            <RadioGroupItem value="female" id="female" />
            <Label htmlFor="female" className="text-lg flex-1 cursor-pointer">
              女性
            </Label>
          </div>
        </RadioGroup>

        <p className="text-sm text-gray-400 mt-4">※登録した性別は変更できません</p>
      </motion.div>

      {/* Next Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="py-4"
      >
        <Button
          className="w-full h-14 text-lg font-medium bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 shadow-lg shadow-pink-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!gender}
        >
          次へ
        </Button>
      </motion.div>
    </div>
  )
}

