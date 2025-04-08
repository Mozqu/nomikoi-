"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useForm, FormProvider } from "react-hook-form"
import { ChevronLeft, X, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { doc, updateDoc, setDoc, serverTimestamp, writeBatch, query, collection, where, getDocs } from "firebase/firestore"
import { auth, db } from "@/app/firebase/config"

type FormData = {
  drinkingTags: string[];
}

const drinkingTags = {
  "お酒の好み・こだわり": [
    "#赤ワイン", "#純米大吟醸", "#ラフロイグ", "#量より質",
    "#ホッピーは3で割る", "#いいちこサイダー", "#ショットNG",
    "#ずっと生", "#ワインはフルボディ", "#フルーティ日本酒"
  ],
  "飲みの生活スタイル": [
    "#昼飲み", "#風呂上りの缶ビール", "#飲まないけど飲みの場は好き",
    "#晩酌は日課", "#週末だけ飲む主義", "#仕事終わりの一杯が至高",
    "#朝まで飲んだ翌日は絶対休む", "#旅行先の酒場でローカル飲み",
    "#料理しながら飲んじゃう", "#ジム帰りのビール背徳感すごい"
  ],
  "飲みキャラ・ノリ・酒癖・体質": [
    "#幹事多め", "#飲むと英語喋る", "#弱いけど人には飲ませたい",
    "#飲みゲームが好き", "#飲んだら長い", "#酔うと喋る",
    "#酔ったら歌いたい", "#脱衣と遺失物", "#赤くなるけど飲める",
    "#ウーロンハイは無限"
  ],
  "飲む場所・空間のこだわり": [
    "#家飲みも好き", "#キャンプでチル飲み", "#隠れ家バー",
    "#新幹線でビール", "#1駅歩くならコンビニ酒", "#テーマパーク飲み",
    "#ロックバー開拓中", "#喫煙可の居酒屋で飲みたい", "#個室でゆったり飲みたい"
  ],
  "お酒の探究・趣味性": [
    "#おすすめのペアリングを試したい", "#ビール工場巡り", "#ソムリエ勉強中",
    "#日本酒検定持ってます", "#ウイスキーマニア", "#発酵や醸造に興味あり",
    "#利き酒チャレンジしてみたい", "#マリアージュ探求", "#酒器こだわり",
    "#世界のビールを制覇したい"
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
        次に、お酒に関する<br />
        あなたの特徴を<br />
        教えてください
      </h1>
      <p className="text-gray-400">
        タグを選んで、あなたのお酒に関する好みや特徴を表現しましょう。
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
      className="w-full flex flex-col h-full overflow-y-auto pb-24"
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold mt-4">お酒に関するタグ</h1>
        <p className="text-gray-400 mt-2 mb-6">
          お酒に関する自分の好みや特徴を表すタグを選んでください。
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
            className="flex-1 bg-transparent border-gray-700 focus:border-gray-500"
          />
          <Button
            onClick={handleAddCustomTag}
            disabled={!customTag}
            className="bg-gray-800 hover:bg-gray-700"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-8">
        {Object.entries(drinkingTags).map(([category, tags]) => (
          <div key={category} className="space-y-3">
            <h2 className="text-lg font-semibold">{category}</h2>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <button
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    selectedTags.includes(tag)
                      ? "bg-pink-600 text-white"
                      : "bg-gray-800 hover:bg-gray-700 text-gray-300"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-black bg-opacity-90 border-t border-gray-800 p-4 z-10">
        <div className="container max-w-lg mx-auto">
          <Button
            onClick={onNext}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-6"
            disabled={selectedTags.length === 0}
          >
            次へ
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

export default function DrinkingTagsPage() {
  const router = useRouter()
  const methods = useForm<FormData>({
    defaultValues: {
      drinkingTags: []
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
      const batch = writeBatch(db)
      const now = new Date()
      
      // #を除去したタグ名の配列を作成
      const normalizedTags = selectedTags.map(tag => tag.replace(/^#/, ''))
      
      // 既存のタグを検索
      const existingTagsQuery = query(
        collection(db, "tags"),
        where("tagName", "in", normalizedTags)
      )
      const existingTagsSnapshot = await getDocs(existingTagsQuery)
      const existingTagNames = new Set(
        existingTagsSnapshot.docs.map(doc => doc.data().tagName)
      )

      // 新規タグのみを作成
      for (const tag of normalizedTags) {
        if (!existingTagNames.has(tag)) {
          const tagRef = doc(db, "tags", crypto.randomUUID())
          batch.set(tagRef, {
            tagName: tag,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
            isDrink: true
          })
        }
      }

      // ユーザータグの関連付けを作成
      for (const tag of normalizedTags) {
        const userTagRef = doc(db, "userTags", `${auth.currentUser.uid}_${tag}`)
        batch.set(userTagRef, {
          userId: auth.currentUser.uid,
          tagName: tag,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          isDrink: true
        })
      }

      // usersコレクションのprofile.tagsに保存
      const userRef = doc(db, "users", auth.currentUser.uid)
      batch.set(userRef, {
        profile: {
          tags: {
            drinking: normalizedTags
          }
        },
        updatedAt: now.toISOString()
      }, { merge: true })

      await batch.commit()
      router.push('/register/hobbyTags')
    } catch (error) {
      console.error("Error saving drinking tags:", error)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <FormProvider {...methods}>
        <div className="flex-1 container max-w-lg mx-auto px-4 py-8 flex flex-col h-screen">
          {step === 0 ? (
            <WelcomeStep onNext={() => setStep(1)} />
          ) : (
            <div className="flex flex-col h-full">
              <div className="w-full flex-shrink-0">
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
              <div className="flex-1 overflow-y-auto">
                <TagSelectionStep 
                  selectedTags={selectedTags}
                  setSelectedTags={setSelectedTags}
                  onNext={handleSubmit}
                />
              </div>
            </div>
          )}
        </div>
      </FormProvider>
    </div>
  )
}
