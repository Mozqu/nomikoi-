"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { doc, updateDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { auth, db, storage } from "@/app/firebase/config"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { motion } from "framer-motion"

type FormData = {
  gender: string
  birthdate: string
  location: string
  nickname: string
  bio: string
}

export default function AdditionalInfoPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>()
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [error, setError] = useState("")
  const router = useRouter()

  const onSubmit = async (data: FormData) => {
    try {
      const user = auth.currentUser
      if (!user) throw new Error("ユーザーが見つかりません")

      let imageUrl = ""
      if (profileImage) {
        const imageRef = ref(storage, `profile_images/${user.uid}`)
        await uploadBytes(imageRef, profileImage)
        imageUrl = await getDownloadURL(imageRef)
      }

      await updateDoc(doc(db, "users", user.uid), {
        ...data,
        profileImageUrl: imageUrl,
      })

      router.push("/dashboard")
    } catch (error) {
      setError("情報の更新に失敗しました。もう一度お試しください。")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cyber-dark cyberpunk-bg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="bg-gray-900 p-8 rounded-lg shadow-lg w-96"
      >
        <h2 className="text-3xl font-bold mb-6 text-center text-neon-blue text-glow">追加情報</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Select onValueChange={(value) => register("gender", { value })}>
            <SelectTrigger className="w-full bg-gray-800 text-white">
              <SelectValue placeholder="性別を選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">男性</SelectItem>
              <SelectItem value="female">女性</SelectItem>
              <SelectItem value="other">その他</SelectItem>
            </SelectContent>
          </Select>
          <Input type="date" {...register("birthdate", { required: true })} className="w-full bg-gray-800 text-white" />
          <Input
            type="text"
            placeholder="住まい"
            {...register("location", { required: true })}
            className="w-full bg-gray-800 text-white"
          />
          <Input
            type="text"
            placeholder="ニックネーム"
            {...register("nickname", { required: true })}
            className="w-full bg-gray-800 text-white"
          />
          <Textarea
            placeholder="自己紹介"
            {...register("bio", { required: true })}
            className="w-full bg-gray-800 text-white"
          />
          <Input
            type="file"
            onChange={(e) => setProfileImage(e.target.files?.[0] || null)}
            className="w-full bg-gray-800 text-white"
          />
          <Button type="submit" className="w-full bg-neon-purple hover:bg-neon-purple/80 text-white">
            情報を更新
          </Button>
        </form>
        {error && <p className="mt-4 text-red-500 text-center">{error}</p>}
      </motion.div>
    </div>
  )
}

