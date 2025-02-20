'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Question, QuestionType } from "@/types/questions"
import { ChevronDown, Heart, X } from "lucide-react"
import { doc, updateDoc } from "firebase/firestore"
import { auth, db } from "@/app/firebase/config"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { useWatch } from 'react-hook-form'
import { useFormContext } from 'react-hook-form'
import { checkListItem, radioItem, toggleListItem } from "@/types/questions"

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
  onNext: () => void;
  isValid: boolean;
  redirectUrl?: string;
  isLastStep: boolean;
  nextStep: () => void;
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
  isLastStep,
  nextStep,
}: QuestionRendererProps) {
  const router = useRouter()
  const [openPopup, setOpenPopup] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<string[]>(value || [])
  const [alcoholPreferences, setAlcoholPreferences] = useState<
    Record<string, AlcoholPreference>
  >({})
  const { watch } = useFormContext()
  const watchedValue = watch(question.id);  // 追加：値を直接監視

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
      console.log('Radio validation:', { 
        value: watchedValue, 
        isValid: isValidValue,
        isLastStep,
        nextStep 
      });

      if (watchedValue && isValid) {
        console.log('Valid value selected, proceeding to next step');
        nextStep();
      }
    }
  }, [question.type, question.id, selectedItems, alcoholPreferences, watchedValue, setIsValid, isLastStep, nextStep]);

  useEffect(() => {
    // 最後の質問かどうかをチェック
    const isLastQuestion = questions.findIndex(q => q.id === currentQuestionId) === questions.length - 1;
    
    if (isLastQuestion && isValid) {
      const formData = watch();
      if (redirectUrl) {  // redirectUrlが存在する場合のみ実行
        handleSubmit(formData, redirectUrl);
      }
    }
  }, [currentQuestionId, questions, isValid, watch, redirectUrl]);

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
    if (!auth.currentUser) return;

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

      const userData = {
        answers,
        drinkingProfileCompleted: true,
        updatedAt: new Date()
      }

      console.log(answers)

      await updateDoc(doc(db, "users", auth.currentUser.uid), userData)
      router.push(redirectUrl)
    } catch (error) {
      console.error("プロフィールの更新に失敗しました:", error)
      alert("プロフィールの更新に失敗しました。もう一度お試しください。")
    }
  }


  // ラジオボタンの onChange ハンドラーも追加
  const handleRadioChange = (value: string) => {
    register(question.id).onChange({ target: { value } });
    console.log(value)
    setIsValid(true);  // ラジオボタン選択時のバリデーション
  };

  switch (question.type) {
    case 'checkbox':
    case 'checklist':
      return (
        <div className="flex flex-wrap gap-4">
          {Array.isArray(question.options) && question.options.map((option: string | checkListItem, index: number) => {
            const optionValue = typeof option === 'string' ? option : (option.name || '');
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
                    console.log(('next'))
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
                      console.log('Radio onChange event:', {
                        value: e.target.value,
                        questionId: question.id
                      });
                      setIsValid(!!e.target.value);
                    }
                  })}
                  className="w-5 h-5 border-2 border-white rounded-full accent-pink-500"
                />
                <span className="text-lg">{label}</span>
              </label>
            );
          })}
        </div>
      )

    case 'toggleList':
      return (
        <div className="flex flex-wrap gap-4">
          {Array.isArray(question.options) && question.options.map((option: toggleListItem, index: number) => {
            console.log(option)
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
                  <IconComponent
                    className={`w-4 h-4 transition-all ${
                      isSelected ? "fill-pink-500 text-pink-500" : "text-gray-400"
                    }`}
                  />
                </button>
              </div>
            )
          })}
        </div>
      );

    default:
      return null;
  }
}