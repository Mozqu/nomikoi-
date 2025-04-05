"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useForm, FormProvider } from "react-hook-form"
import { ChevronLeft, X, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { doc, updateDoc } from "firebase/firestore"
import { auth, db } from "@/app/firebase/config"

type FormData = {
  hobbyTags: string[];
}

const hobbyTags = {
  "アウトドア・スポーツ": [
    "#キャンプ", "#登山", "#サーフィン", "#ゴルフ", 
    "#テニス", "#ヨガ", "#ランニング", "#スキー",
    "#ボルダリング", "#トレッキング"
  ],
  "アート・クリエイティブ": [
    "#写真撮影", "#絵画", "#陶芸", "#DIY",
    "#デザイン", "#イラスト", "#手芸", "#音楽",
    "#カリグラフィー", "#フラワーアレンジメント"
  ],
  "カルチャー・学び": [
    "#読書", "#映画鑑賞", "#美術館巡り", "#語学",
    "#歴史", "#哲学", "#建築", "#茶道",
    "#華道", "#書道"
  ],
  "フード・クッキング": [
    "#料理", "#パン作り", "#お菓子作り", "#コーヒー",
    "#ワイン", "#日本酒", "#チーズ", "#スパイス料理",
    "#発酵食品作り", "#燻製作り"
  ],
  "テクノロジー・ガジェット": [
    "#プログラミング", "#ガジェット", "#VR", "#ドローン",
    "#3Dプリンター", "#スマートホーム", "#自作PC",
    "#電子工作", "#ロボット", "#AI"
  ]
}

// WelcomeStepコンポーネント
function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full flex flex-col items-center justify-center text-center space-y-6"
    >
      <h1 className="text-3xl font-bold">
        次に、趣味に関する<br />
        あなたの特徴を<br />
        教えてください
      </h1>
      <p className="text-gray-400">
        タグを選んで、あなたの趣味や関心事を表現しましょう。
      </p>
      <div className="w-full mt-auto py-4">
        <Button
          onClick={onNext}
          className="w-full h-14 text-lg font-medium bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
        >
          タグを選択する
        </Button>
      </div>
    </motion.div>
  )
}

// メインのタグ選択ステップコンポーネント
function TagSelectionStep({ 
  selectedTags,
  setSelectedTags,
  onNext 
}: { 
  selectedTags: string[];
  setSelectedTags: React.Dispatch<React.SetStateAction<string[]>>;
  onNext: () => void;
}) {
  const [customTag, setCustomTag] = useState("")

  const handleTagClick = (tag: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag)
      }
      return [...prev, tag]
    })
  }

  const handleAddCustomTag = () => {
    if (customTag && !selectedTags.includes("#" + customTag)) {
      const newTag = "#" + customTag.trim().replace(/^#/, "")
      setSelectedTags(prev => [...prev, newTag])
      setCustomTag("")
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full flex flex-col"
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold mt-4">趣味に関するタグ</h1>
        <p className="text-gray-400 mt-2 mb-6">
          あなたの趣味や関心事を表すタグを選んでください。
          複数選択可能です。
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {selectedTags.map(tag => (
            <div
              key={tag}
              className="bg-pink-600 text-white px-3 py-1.5 rounded-full text-sm flex items-center gap-1"
            >
              {tag}
              <button
                onClick={() => handleTagClick(tag)}
                className="hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-8">
          <Input
            type="text"
            placeholder="カスタムタグを追加（#は不要）"
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddCustomTag()
              }
            }}
            className="flex-1 bg-transparent border-gray-700 focus:border-gray-500 focus:ring-pink-500"
          />
          <Button
            onClick={handleAddCustomTag}
            disabled={!customTag}
            className="bg-pink-600 hover:bg-pink-700 text-white"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 space-y-8 mb-24">
        {Object.entries(hobbyTags).map(([category, tags]) => (
          <div key={category} className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-200">{category}</h2>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <button
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    selectedTags.includes(tag)
                      ? "bg-pink-600 text-white hover:bg-pink-700"
                      : "bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-black bg-opacity-90 border-t border-gray-800 p-4">
        <div className="container max-w-lg mx-auto">
          <Button
            onClick={onNext}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white py-6"
            disabled={selectedTags.length === 0}
          >
            次へ
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

export default function HobbyTagsPage() {
  const router = useRouter()
  const methods = useForm<FormData>({
    defaultValues: {
      hobbyTags: []
    }
  })
  const [step, setStep] = useState(0)
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const handleSubmit = async () => {
    if (!auth || !auth.currentUser || !db) {
      console.error("No user logged in or database not initialized")
      return
    }

    try {
      const userRef = doc(db, "users", auth.currentUser.uid)
      await updateDoc(userRef, {
        hobbyTags: selectedTags
      })
      router.push('/register/recommend_drinking_character')
    } catch (error) {
      console.error("Error saving hobby tags:", error)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <FormProvider {...methods}>
        <div className="flex-1 container max-w-lg mx-auto px-4 py-8 flex flex-col">
          {step === 0 ? (
            <WelcomeStep onNext={() => setStep(1)} />
          ) : (
            <>
              <div className="w-full">
                <div className="flex items-center mb-2">
                  <button onClick={() => setStep(0)} className="p-2 -ml-2">
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <div className="flex-1 text-center text-sm text-gray-400">
                    1/1
                  </div>
                </div>
                <div className="relative w-full h-1 bg-gray-600 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-pink-500 to-purple-600"
                  />
                </div>
              </div>
              <TagSelectionStep 
                selectedTags={selectedTags}
                setSelectedTags={setSelectedTags}
                onNext={handleSubmit}
              />
            </>
          )}
        </div>
      </FormProvider>
    </div>
  )
}
