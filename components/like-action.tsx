'use client'

import { useState, useEffect } from 'react'
import { Heart, HeartCrack } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { addDoc, collection, query, where, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore"
import { db, auth } from "@/app/firebase/config"
import { useRouter } from 'next/navigation'

interface LikeActionProps {
  targetId: string
}

export function LikeAction({ targetId }: LikeActionProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentAction, setCurrentAction] = useState<'like' | 'nope' | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUserId(user?.uid || null)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const fetchCurrentAction = async () => {
      if (!currentUserId || !db) {
        console.log("ユーザーが未認証またはDBが初期化されていません")
        return
      }
      
      try {
        console.log("currentUserId", currentUserId)
        const q = query(
          collection(db, "user_likes"),
          where("uid", "==", currentUserId),
          where("target_id", "==", targetId)
        )
        const querySnapshot = await getDocs(q)
        console.log("querySnapshot", querySnapshot)
        if (!querySnapshot.empty) {
          setCurrentAction(querySnapshot.docs[0].data().type)
        }
      } catch (error) {
        console.error("アクションの取得に失敗しました:", error)
      }
    }

    fetchCurrentAction()
  }, [currentUserId, targetId])

  const handleAction = async (type: 'like' | 'nope') => {
    if (!currentUserId || !db || isSubmitting) {
      console.log("アクションを実行できません")
      return
    }
    
    setIsSubmitting(true)
    try {
      const q = query(
        collection(db, "user_likes"),
        where("uid", "==", currentUserId),
        where("target_id", "==", targetId)
      )
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        const existingDoc = querySnapshot.docs[0]
        const existingType = existingDoc.data().type

        if (existingType === type) {
          await deleteDoc(doc(db, "user_likes", existingDoc.id))
          setCurrentAction(null)
        } else {
          await updateDoc(doc(db, "user_likes", existingDoc.id), {
            type: type,
            updated_at: new Date()
          })
          setCurrentAction(type)
        }
      } else {
        await addDoc(collection(db, "user_likes"), {
          uid: currentUserId,
          target_id: targetId,
          type: type,
          created_at: new Date()
        })
        setCurrentAction(type)
      }
    } catch (error) {
      console.error("アクションの保存に失敗しました:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="">
      {/* nope 
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          size="lg"
          variant="secondary"
          className={`rounded-full backdrop-blur-md px-8 py-6 flex items-center justify-center gap-2 transition-all duration-500 ${
            currentAction === 'nope'
              ? 'bg-black hover:bg-zinc-900 border border-zinc-800 shadow-[inset_0_0_15px_rgba(255,0,0,0.2)]'
              : 'bg-zinc-800/80 hover:bg-zinc-700/80'
          }`}
          onClick={() => handleAction('nope')}
          disabled={isSubmitting}
        >
          <HeartCrack 
            className={`transition-all duration-500 ${
              currentAction === 'nope' 
                ? 'h-8 w-8 text-white rotate-12 transform-gpu animate-[bounce_2s_ease-in-out_infinite]' 
                : 'h-7 w-7 text-white'
            }`} 
          />
          {currentAction !== 'nope' && (
            <span className="text-lg font-semibold">
              Nope
            </span>
          )}
        </Button>
      </motion.div>
      */}
      {/* like */}
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          size="lg"
          variant="default"
          style={{
            background: currentAction === 'like' ? "" : "none",
            border: currentAction === 'like' ? "none" : "2px solid #fff",
          }}
          className={`rounded-full backdrop-blur-md text-white flex items-center gap-2 transition-all duration-300 ${
            currentAction === 'like'
              ? 'neon-bg hover:from-pink-600/90 hover:to-cyan-600/90 shadow-[0_0_15px_rgba(0,255,255,0.5)]'
              : 'neon-bg'
          }`}
          onClick={() => handleAction('like')}
          disabled={isSubmitting}
        >
          <Heart className={`transition-all duration-500 ${
            currentAction === 'like' 
              ? 'h-8 w-8 fill-white text-glow rotate-12 transform-gpu animate-[bounce_2s_ease-in-out_infinite]' 
              : 'h-7 w-7'
          }`} />
          {currentAction !== 'like' && (
            <span className="text-lg font-semibold">
              Like
            </span>
          )}
        </Button>
      </motion.div>
    </div>
  )
} 