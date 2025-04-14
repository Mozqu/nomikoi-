"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronLeft, Plus } from 'lucide-react'
import { drinkingTags, hobbyTags } from '@/app/constants/tags'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/app/firebase/config'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ui/use-toast'

export default function TagsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [selectedDrinkingTags, setSelectedDrinkingTags] = useState<string[]>([])
  const [selectedHobbyTags, setSelectedHobbyTags] = useState<string[]>([])
  const [customDrinkingTag, setCustomDrinkingTag] = useState('')

  const handleTagSelect = (tag: string) => {
    if (selectedDrinkingTags.includes(tag)) {
      setSelectedDrinkingTags(selectedDrinkingTags.filter(t => t !== tag))
    } else if (selectedDrinkingTags.length < 20) {
      setSelectedDrinkingTags([...selectedDrinkingTags, tag])
    } else {
      toast({
        title: "タグ選択制限",
        description: "タグは最大20個までしか選択できません。",
        variant: "destructive"
      })
    }
  }

  const addCustomTag = () => {
    if (!customDrinkingTag) return
    const tag = customDrinkingTag.startsWith('#') ? customDrinkingTag : `#${customDrinkingTag}`
    if (!selectedDrinkingTags.includes(tag)) {
      handleTagSelect(tag)
      setCustomDrinkingTag('')
    }
  }

  const handleSave = async () => {
    if (!user || !db) {
      toast({
        title: "エラー",
        description: "ログインが必要です。",
        variant: "destructive"
      })
      return
    }

    try {
      const userRef = doc(db, 'users', user.uid)
      await updateDoc(userRef, {
        drinkingTags: selectedDrinkingTags,
      })

      toast({
        title: "保存完了",
        description: "タグの設定を保存しました。",
      })

      router.push('/profile')
    } catch (error) {
      console.error('Error saving tags:', error)
      toast({
        title: "エラー",
        description: "タグの保存中にエラーが発生しました。",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 container max-w-lg mx-auto px-4 py-8 flex flex-col h-screen">
        <div className="flex flex-col h-full">
          {/* プログレスバー */}
          <div className="w-full flex-shrink-0">
            <div className="flex items-center mb-2">
              <button className="p-2 -ml-2" onClick={() => router.back()}>
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div className="flex-1 text-center text-sm text-gray-400">1/1</div>
            </div>
            <div className="relative w-full h-1 bg-gray-600 rounded-full overflow-hidden">
              <div 
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-pink-500 to-purple-600"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* メインコンテンツ */}
          <div className="flex-1 overflow-y-auto">
            <div className="w-full flex flex-col h-full overflow-y-auto pb-24">
              <div className="mb-8">
                <h1 className="text-2xl font-bold mt-4">お酒に関するタグ</h1>
                <p className="text-gray-400 mt-2 mb-6">
                  お酒に関する自分の好みや特徴を表すタグを選んでください。
                  複数選択可能です。
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedDrinkingTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleTagSelect(tag)}
                      className="px-3 py-1.5 rounded-full text-sm bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                    >
                      {tag}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 mb-8">
                  <Input
                    value={customDrinkingTag}
                    onChange={(e) => setCustomDrinkingTag(e.target.value)}
                    placeholder="カスタムタグを追加（#は不要）"
                    className="flex-1 bg-transparent border-gray-700 focus:border-gray-500"
                  />
                  <Button
                    onClick={addCustomTag}
                    disabled={!customDrinkingTag}
                    className="bg-gray-800 hover:bg-gray-700"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-8">
                {Object.entries(drinkingTags).map(([category, tags]) => (
                  <div key={category} className="space-y-3">
                    <h2 className="text-lg font-semibold">
                      {category === 'preferences' && 'お酒の好み・こだわり'}
                      {category === 'lifestyle' && '飲みの生活スタイル'}
                      {category === 'character' && '飲みキャラ・ノリ・酒癖・体質'}
                      {category === 'places' && '飲む場所・空間のこだわり'}
                      {category === 'exploration' && 'お酒の探究・趣味性'}
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => handleTagSelect(tag)}
                          className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                            selectedDrinkingTags.includes(tag)
                              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                              : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* 固定フッター */}
              <div className="fixed bottom-0 left-0 right-0 bg-black bg-opacity-90 border-t border-gray-800 p-4 z-10">
                <div className="container max-w-lg mx-auto">
                  <Button
                    onClick={handleSave}
                    disabled={selectedDrinkingTags.length === 0}
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-6"
                  >
                    次へ
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 