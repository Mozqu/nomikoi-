'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Question, QuestionOption, QuestionType } from "@/types/questions"
import { ChevronDown, Heart, X } from "lucide-react"
import { doc, updateDoc } from "firebase/firestore"
import { auth, db } from "@/app/firebase/config"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"

// Record<string, number>型をQuestionOption[]に変換する関数
const convertOptions = (options: Record<string, number>): QuestionOption[] => {
  return Object.entries(options).map(([label, value]) => ({
    label,
    value
  }))
}

interface AlcoholType {
  name: string;
  subtypes?: string[];
}

interface QuestionRendererProps {
  question: Question;
  register: any;
  value: any;
  setIsValid: (isValid: boolean) => void;
  onSubmit?: (redirectUrl: string) => void;
  setValue?: (name: string, value: any) => void;
  questions: Question[];
  currentQuestionId: string;
  onPrevious: () => void;
  onNext: () => void;
  isValid: boolean;
}

export function QuestionRenderer({ 
  question, 
  register, 
  value,
  setIsValid,
  onSubmit,
}: QuestionRendererProps) {
  const router = useRouter()
  const [openPopup, setOpenPopup] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<string[]>(value || [])
  const [alcoholPreferences, setAlcoholPreferences] = useState<
    Record<string, { mainSelected: number; subtypes: Record<string, number> }>
  >({})

  useEffect(() => {
    // 初期状態のバリデーション
    if (question.type === 'checkbox') {
      // チェックボックスの場合、選択された項目があるかチェック
      const selectedCount = selectedItems?.length || 0;
      setIsValid(selectedCount > 0);
    } else if (question.type === 'toggleList') {
      // アルコールの場合、メインまたはサブタイプで選択があるかチェック
      const hasSelection = Object.values(alcoholPreferences).some(pref => 
        pref.mainSelected === 1 || Object.values(pref.subtypes || {}).some(v => v === 1)
      );
      setIsValid(hasSelection);
    }
  }, [question.type, selectedItems, alcoholPreferences]);

  const handleSubmit = async (data: any, redirectUrl: string) => {
    if (!auth.currentUser) {
      console.error("ユーザーが認証されていません")
      return
    }

    try {
      // 診断結果を生成
      const drunkPersonality = {
        alcoholPreferences: {
          favorites: [
            ...Object.entries(alcoholPreferences).flatMap(([name, pref]) => {
              const mainFavorites = pref.mainSelected === 1 ? [name] : [];
              const subFavorites = Object.entries(pref.subtypes || {})
                .filter(([_, value]) => value === 1)
                .map(([subtype]) => subtype);
              return [...mainFavorites, ...subFavorites];
            })
          ]
        }
      }

      const userData = {
        ...data,
        favorite_alcohol: alcoholPreferences,
        drunk_personality: drunkPersonality,
        drinkingProfileCompleted: true,
        updatedAt: new Date()
      }

      await updateDoc(doc(db, "users", auth.currentUser.uid), userData)
      router.push(redirectUrl)
    } catch (error) {
      console.error("プロフィールの更新に失敗しました:", error)
      alert("プロフィールの更新に失敗しました。もう一度お試しください。")
    }
  }

  const toggleMainPreference = (name: string) => {
    const newValue = alcoholPreferences[name]?.mainSelected === 1 ? 0 : 1;
    setAlcoholPreferences(prev => ({
      ...prev,
      [name]: {
        mainSelected: newValue,
        subtypes: prev[name]?.subtypes || {}
      }
    }));
    register(question.id).onChange({ target: { value: alcoholPreferences } });
    
    // 少なくとも1つの選択があれば有効とする
    const hasSelection = Object.values(alcoholPreferences).some(pref => 
      pref.mainSelected === 1 || Object.values(pref.subtypes || {}).some(v => v === 1)
    );
    setIsValid(hasSelection);
  }

  const togglePreference = (name: string, subtype: string) => {
    const newValue = (alcoholPreferences[name]?.subtypes?.[subtype] || 0) === 1 ? 0 : 1;
    const currentSubtypes = {
      ...alcoholPreferences[name]?.subtypes,
      [subtype]: newValue
    };

    // サブカテゴリーにチェックがあるかチェック
    const hasCheckedSubtypes = Object.values(currentSubtypes).some(v => v === 1);

    setAlcoholPreferences(prev => ({
      ...prev,
      [name]: {
        mainSelected: hasCheckedSubtypes ? 1 : 0,
        subtypes: {
          ...currentSubtypes
        }
      }
    }));
    register(question.id).onChange({ target: { value: alcoholPreferences } });
    
    // 少なくとも1つの選択があれば有効とする
    setIsValid(hasCheckedSubtypes);
  }

  // Record<string, number>型の場合はQuestionOption[]に変換
  const options = typeof question.options === 'object' && !Array.isArray(question.options)
    ? convertOptions(question.options as Record<string, number>)
    : question.options;

  
    const IconComponent = question.id === 'dislike_alcohol' ? X : Heart;


  switch (question.type) {
    case 'checkbox':
    case 'checklist':
      return (
        <div className="flex flex-wrap gap-4">
          {options?.map((option, index) => {
            const optionValue = typeof option === 'string' ? option : option.label;
            const isSelected = selectedItems.includes(optionValue);
            const uniqueKey = `${question.id}-${optionValue}-${index}`;

            return (
              <div key={uniqueKey}>
                <button
                  type="button"
                  onClick={() => {
                    const currentValue = selectedItems;
                    const newValue = currentValue.includes(optionValue)
                      ? currentValue.filter(v => v !== optionValue)
                      : [...currentValue, optionValue];
                    
                    setSelectedItems(newValue);
                    
                    register(question.id).onChange({ target: { value: newValue } });
                  }}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 
                    ${isSelected
                      ? "border-pink-500"
                      : "border-gray-600 hover:border-gray-400"
                    } transition-colors cursor-pointer`}
                >
                  <span>{optionValue}</span>
                  <IconComponent
                    className={`w-4 h-4 transition-all ${
                      isSelected
                        ? "fill-pink-500 text-pink-500"
                        : "text-gray-400"
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      )

    case 'radio':
      return (
        <div className="space-y-4">
          {options?.map((option, index) => {
            const optionLabel = typeof option === 'string' ? option : option.label;
            const uniqueKey = `${question.id}-radio-${optionLabel}-${index}`;
            
            return (
              <label
                key={uniqueKey}
                className="flex items-center space-x-4 rounded-lg border-2 border-gray-800 p-4 hover:bg-white/5 transition-colors cursor-pointer"
              >
                <input
                  type="radio"
                  value={typeof option === 'string' ? option : option.value}
                  {...register(question.id)}
                  className="w-5 h-5 border-2 border-white rounded-full accent-pink-500"
                />
                <span className="text-lg">{optionLabel}</span>
              </label>
            );
          })}
        </div>
      )

    case 'toggleList':
      return (
        <div className="flex flex-wrap gap-4">
          {options?.map((option, index) => {
            const uniqueKey = `${question.id}-toggle-${option.name}-${index}`;
            const isSelected = alcoholPreferences[option.name]?.mainSelected === 1 || 
              Object.values(alcoholPreferences[option.name]?.subtypes || {}).some(v => v === 1);
            
            return (
              <div key={uniqueKey} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    if (option.subtypes?.length) {
                      setOpenPopup(openPopup === option.name ? null : option.name)
                    } else {
                      toggleMainPreference(option.name)
                    }
                  }}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 
                    ${isSelected
                      ? "border-pink-500"
                      : "border-gray-600 hover:border-gray-400"
                    } transition-colors cursor-pointer`}
                >
                  {option.name}
                  <IconComponent
                    className={`w-4 h-4 transition-all ${
                      isSelected
                        ? "fill-pink-500 text-pink-500"
                        : "text-gray-400"
                    }`}
                  />
                </button>
              </div>
            )
          })}
          <AnimatePresence>
            {openPopup && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
                onClick={() => setOpenPopup(null)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-gray-800 rounded-lg p-6 w-full max-w-sm max-h-[80vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">{openPopup}の種類</h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {options
                      .find((a) => a.name === openPopup)
                      ?.subtypes?.map((subtype) => (
                        <button
                          type="button"
                          key={subtype}
                          onClick={() => togglePreference(openPopup, subtype)}
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border-2 
                            ${alcoholPreferences[openPopup]?.subtypes?.[subtype] === 1
                              ? "border-pink-500"
                              : "border-gray-600 hover:border-gray-400"
                            } transition-colors`}
                        >
                          {subtype}
                          <IconComponent
                            className={`w-4 h-4 transition-all ${
                              alcoholPreferences[openPopup]?.subtypes?.[subtype] === 1
                                ? "fill-pink-500 text-pink-500"
                                : "text-gray-400"
                            }`}
                          />
                        </button>
                      ))}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )

    default:
      return (
        <Input
          type="text"
          {...register(question.id)}
          className="w-full bg-transparent border-b-2 border-gray-600 p-2 text-xl focus:border-white"
          placeholder={question.description}
        />
      )
  }
} 