'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Question, QuestionType } from "@/types/questions"
import { ChevronDown, Heart, X } from "lucide-react"
import { doc, updateDoc, setDoc } from "firebase/firestore"
import { auth, db } from "@/app/firebase/config"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { useWatch } from 'react-hook-form'
import { useFormContext } from 'react-hook-form'
import { checkListItem, radioItem, toggleListItem } from "@/types/questions"
import { lastDayOfDecade } from 'date-fns'
import { Firestore } from 'firebase/firestore'

interface AlcoholPreference {
  mainSelected: number;
  subtypes: Record<string, number>;
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
  isValid: boolean;
  redirectUrl?: string;
  isLastStep?: boolean;
  showNextButton?: boolean;
  onNext: () => void;
}

export function QuestionRenderer({ 
  question, 
  register, 
  value,
  setIsValid,

  onSubmit,
  questions,
  currentQuestionId,
  isValid,
  redirectUrl,
  showNextButton,
  onNext
}: QuestionRendererProps) {
  const router = useRouter()
  const [openPopup, setOpenPopup] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<string[]>(value || [])
  const [alcoholPreferences, setAlcoholPreferences] = useState<
    Record<string, AlcoholPreference>
  >({})
  const { watch } = useFormContext()
  const watchedValue = watch(question.id);  // 追加：値を直接監視
  
  // isLastStepを計算
  const isLastStep = useMemo(() => {
    if (!questions || !currentQuestionId) return false;
    const currentIndex = questions.findIndex(q => q.id === currentQuestionId);
    return currentIndex === questions.length - 1;
  }, [questions, currentQuestionId]);

  useEffect(() => {
    if (question.type === 'checkbox') {
      const selectedCount = selectedItems?.length || 0;
      setIsValid(selectedCount > 0);
    } else if (question.type === 'toggleList') {
      const hasSelection = Object.values(alcoholPreferences).some(pref => 
        pref.mainSelected === 1 || Object.values(pref.subtypes || {}).some(v => v === 1)
      );
      setIsValid(hasSelection);
    } else if (question.type === 'radio') {
      const isValidValue = !!watchedValue;
      setIsValid(isValidValue);
    }

  }, [question.type, question.id, selectedItems, alcoholPreferences, watchedValue, setIsValid, isLastStep]);

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

  const IconComponent = question.id === 'dislike_alcohol' ? X : Heart;

  const handleSubmit = async (data: any, redirectUrl: string) => {
    console.log("handleSubmit", data)
    if (!auth.currentUser) {
      console.error("ユーザーがログインしていません");
      return;
    }

    const { alcoholPreferences = {} } = data;  // デフォルト値を設定

    try {
      // DB構造に合わせてデータを整形
      const answers = {
        favorite_alcohol: {
          ...(data.drinking_location_preference && {
            drinking_location_preference: data.drinking_location_preference
          }),
          favorite_alcohol: Object.entries(alcoholPreferences).flatMap(([name, pref]) => {
            const mainFavorites = pref.mainSelected === 1 ? [name] : [];
            const subFavorites = Object.entries(pref.subtypes || {})
              .filter(([_, value]) => value === 1)
              .map(([subtype]) => subtype);
            return [...mainFavorites, ...subFavorites];
          }),
          ...(data.dislike_alcohol && {
            dislike_alcohol: data.dislike_alcohol
          })
        },
        acceptable_drinking_habit: Object.fromEntries(
          Object.entries({
            personal_alcohol_strength: Number(data.personal_alcohol_strength),
            drink_turns_red: Number(data.drink_turns_red),
            drink_until_blackout: Number(data.drink_until_blackout),
            forget_after_drinking: Number(data.forget_after_drinking),
            overdrink_often: Number(data.overdrink_often),
            talk_to_neighbors: Number(data.talk_to_neighbors),
            sleepy_after_drinking: Number(data.sleepy_after_drinking),
            lose_items_when_drunk: Number(data.lose_items_when_drunk),
            negative_emotions_when_drunk: Number(data.negative_emotions_when_drunk),
            cry_when_drunk: Number(data.cry_when_drunk),
            laugh_uncontrollably_when_drunk: Number(data.laugh_uncontrollably_when_drunk),
            regret_texting_when_drunk: Number(data.regret_texting_when_drunk)
          }).filter(([_, value]) => value !== undefined)
        ),
        way_of_drinking: Object.fromEntries(
          Object.entries({
            ideal_drinking_time: Number(data.ideal_drinking_time),
            drinking_amount: Number(data.drinking_amount),
            drinking_frequency: Number(data.drinking_frequency),
            food_pairing_importance: Number(data.food_pairing_importance),
            alcohol_quality_preference: Number(data.alcohol_quality_preference),
            party_drink_preference: Number(data.party_drink_preference)
          }).filter(([_, value]) => value !== undefined)
        )
      }

      if (auth.currentUser && isLastStep) {

        const userData = {
          answers,
          drinkingProfileCompleted: true,
          updatedAt: new Date()
        }

        // Firebaseにデータを保存
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        await setDoc(userDocRef, userData, { merge: true });
        
        console.log("データが正常に保存されました"); // デバッグ用

        router.push(redirectUrl);

      }
    } catch (error) {
      console.error("データの保存に失敗しました:", error); // エラーの詳細を確認
      alert("プロフィールの更新に失敗しました。もう一度お試しください。")
    }
  }
  
  switch (question.type) {
    case 'checkbox':
    case 'checklist':
      return (
        <div className="flex flex-wrap gap-4">
          {Array.isArray(question.options) && (question.options as string[]).map((option, index: number) => {
            const optionValue = typeof option === 'string' ? option : '';
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
                    ${isSelected ? "border-pink-500" : "border-gray-600 hover:border-gray-400"}
                    transition-colors cursor-pointer`}
                >
                  <span>{optionValue}</span>
                  <IconComponent
                    className={`w-4 h-4 transition-all ${
                      isSelected ? "fill-pink-500 text-pink-500" : "text-gray-400"
                    }`}
                  />
                </button>
              </div>
            );
          })}
          {showNextButton && (
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/80 backdrop-blur-sm">
              <div className="container max-w-lg mx-auto">
                <Button
                  onClick={async () => {
                    const formData = watch();
                    await handleSubmit(formData, redirectUrl || '/login');
                  }}
                  disabled={!isValid}
                  className="w-full h-14 text-lg font-medium bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                >
                  次へ
                </Button>
              </div>
            </div>
          )}
        </div>
      )

    case 'radio':
      console.log("radio")
      return (
        <div className="space-y-4">
          {Object.entries(question.options as radioItem).map(([label, value], index) => {
            const uniqueKey = `${question.id}-radio-${label}-${index}`;
            return (
              
              <label
                key={uniqueKey}
                className="flex items-center space-x-4 rounded-lg border-2 border-gray-800 p-4 hover:bg-white/5 transition-colors cursor-pointer"
              >
                <input
                  type="radio"
                  value={value}
                  {...register(question.id, {
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                      setIsValid(!!e.target.value);
                    }
                  })}
                    onClick={() => {
                      if (isLastStep) {
                        const formData = watch();
                        handleSubmit(formData, redirectUrl || '/login');
                      } else {
                        onNext()
                      }
                  }}
                  id="test-radio"
                  className="w-5 h-5 border-2 border-white rounded-full accent-pink-500"
                />
                <span className="text-lg">{label}</span>
              </label>
            );
          })}
          
          
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/80 backdrop-blur-sm">
            <div className="container max-w-lg mx-auto">
              <Button
                onClick={async () => {
                  if (isLastStep) {
                    const formData = watch();
                    await handleSubmit(formData, redirectUrl || '/login');
                  } else {
                    nextStep()
                  }
                }}
                disabled={!isValid}
                className="w-full h-14 text-lg font-medium bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
              >
                次へ
              </Button>
            </div>
          </div>      
        </div>
      )

    case 'toggleList':
      return (
        <div className="flex flex-wrap gap-4">
          {Array.isArray(question.options) && question.options.map((option: toggleListItem, index: number) => {
            const uniqueKey = `${question.id}-toggle-${option.name || ''}-${index}`;
            const isSelected = alcoholPreferences[option.name as string]?.mainSelected === 1 || 
              Object.values(alcoholPreferences[option.name as string]?.subtypes || {}).some(v => v === 1);
            
            return (
              <div key={uniqueKey} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    if (option.subtypes?.length) {
                      setOpenPopup(openPopup === option.name ? null : (option.name || ''))
                    } else {
                      toggleMainPreference(option.name as string)
                    }
                  }}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 
                    ${isSelected ? "border-pink-500" : "border-gray-600 hover:border-gray-400"}
                    transition-colors cursor-pointer`}
                >
                  {option.name}
                  {option.subtypes?.length && (
                    <ChevronDown className={`w-4 h-4 transition-transform ${openPopup === option.name ? 'rotate-180' : ''}`} />
                  )}
                  <IconComponent
                    className={`w-4 h-4 transition-all ${
                      isSelected ? "fill-pink-500 text-pink-500" : "text-gray-400"
                    }`}
                  />
                </button>

                {/* サブタイプのモーダル */}
                <AnimatePresence>
                  {openPopup === option.name && option.subtypes && (
                    <>
                      {/* オーバーレイ背景 */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
                        onClick={() => setOpenPopup(null)}
                      />

                      {/* モーダルコンテンツ */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed inset-0 flex items-center justify-center z-[101]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="w-[90%] max-w-md p-6 bg-gray-900 rounded-xl shadow-xl border border-gray-700">
                          <div className="mb-4 text-lg font-medium">{option.name}を選択</div>
                          <div className="flex flex-wrap gap-3 max-h-[60vh] overflow-y-auto">
                            {option.subtypes.map((subtype, subIndex) => {
                              const isSubtypeSelected = alcoholPreferences[option.name as string]?.subtypes?.[subtype] === 1;
                              return (
                                <button
                                  key={`${uniqueKey}-sub-${subIndex}`}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    togglePreference(option.name as string, subtype);
                                  }}
                                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 
                                    ${isSubtypeSelected ? "border-pink-500" : "border-gray-600 hover:border-gray-400"}
                                    transition-colors cursor-pointer`}
                                >
                                  <span>{subtype}</span>
                                  <IconComponent
                                    className={`w-4 h-4 transition-all ${
                                      isSubtypeSelected ? "fill-pink-500 text-pink-500" : "text-gray-400"
                                    }`}
                                  />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
          {showNextButton && (
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/80 backdrop-blur-sm">
              <div className="container max-w-lg mx-auto">
                <Button
                  onClick={async () => {
                    if (isLastStep) {
                      const formData = watch();
                      await handleSubmit(formData, redirectUrl || '/login');
                    } else {
                      nextStep()
                    }
                  }}
                  disabled={!isValid}
                  className="w-full h-14 text-lg font-medium bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                >
                  次へ
                </Button>
              </div>
            </div>
          )}
        </div>
      );

    default:
      return null;
  }

}
  