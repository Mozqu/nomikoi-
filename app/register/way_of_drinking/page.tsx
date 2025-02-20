"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useForm, FormProvider, useFormContext } from "react-hook-form"
import { ChevronLeft, Heart, X, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { doc, updateDoc } from "firebase/firestore"
import { auth, db } from "@/app/firebase/config"
import { QuestionRenderer } from "@/app/components/question-renderer"
import type { Question, radioItem } from "@/types/questions"

type FormData = {
  ideal_drinking_time: string;
  drinking_frequency: string;
  drinking_location_preference: string[];
  drinking_capacity: string;
  alcohol_tolerance: string;
  drinking_behavior: string[];
  partner_tolerance: string[];
  favorite_alcohol: Record<string, { 
    mainSelected: number; 
    subtypes: Record<string, number> 
  }>;
}

interface AlcoholType {
  name: string;
  subtypes?: string[];
}

// optionsの型を変換する関数
const convertOptions = (options: radioItem): { label: string; value: number }[] => {
  return Object.entries(options).map(([label, value]) => ({
    label,
    value
  }))
}

// 質問データ
const questions: Record<number, Question> = {
  1: {
    id: "ideal_drinking_time",
    title: "理想の飲み平均時間は？",
    options: {
      "1時間未満（サクッと）": 1,
      "2-3時間（一次会）": 2,
      "4-6時間（二次会～終電）": 3,
      "6-9時間（三次会～タクシー帰り）": 4,
      "12時間以上（朝まで）": 5
    } as radioItem,
    type: "radio"
  },
  2: {
    id: "drinking_amount",
    title: "飲む量はどのくらい？",
    options: {
      "全く飲まない（純アルコール0g）": 0,
      "少量飲む（1～9g）": 1,
      "控えめに飲む（10～29g）": 2,
      "普通に飲む（30～49g）": 3,
      "そこそこ飲む（50～79g）": 4,
      "かなり飲む（80g以上）": 5
    },
    type: "radio"
  },
  3: {
    id: "drinking_frequency",
    title: "理想の飲み会頻度は？",
    options: {
      "ほぼ飲まない（月1回以下）": 1,
      "たまに飲む（月2～3回）": 2,
      "普通（週1回程度）": 3,
      "よく飲む（週2～3回）": 4,
      "飲み会がライフスタイル（週4回以上）": 5
    },
    type: "radio"
  },
  4: {
    "id": "food_pairing_importance",
    "title": "食事との相性は重視する？（ペアリング重視度）",
    "options": {
      "あまり気にしない": 1,
      "不味くなければ": 2,
      "合った方がいい": 3,
      "こだわる方だ": 4,
      "かなりこだわる": 5
    },
    "type": "radio"
  },
  5: {
    "id": "alcohol_quality_preference",
    "title": "お酒の味や品質はこだわる？（味わい志向）",
    "options": {
      "あまり気にしない": 1,
      "不味くなければいい": 2,
      "美味しいければいい": 3,
      "好みがあり、色々試したい": 4,
      "品種名や産地を知っている": 5
    },
    "type": "radio"
  },
  6: {
    "id": "party_drink_preference",
    "title": "パーティードリンクは楽しめる？（ノリ優先度）",
    "options": {
      "飲みたくない": 1,
      "できれば飲みたくない": 2,
      "流れでたまに飲むのは楽しい": 3,
      "好きな方だ": 4,
      "大好きだ": 5
    },
    "type": "radio"
  }
}

// ウェルカムステップコンポーネント
function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full flex flex-col items-center justify-center text-center space-y-6"
    >
      <h1 className="text-3xl font-bold">
        次に、質問に答えて<br />
        あなたのプロフィールを<br />
        作成しましょう
      </h1>
      <p className="text-gray-400">
        質問に答えていくと、自動的にプロフィールが作成されます。
      </p>
      <div className="w-full mt-auto py-4">
        <Button
          onClick={onNext}
          className="w-full h-14 text-lg font-medium bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
        >
          プロフィールを入力する
        </Button>
      </div>
    </motion.div>
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)  // 0をウェルカムステップに
  const totalSteps = Object.keys(questions).length  // 質問の総数を動的に取得
  const methods = useForm<FormData>({
    defaultValues: {
      
      ideal_drinking_time: '',
      drinking_frequency: '',
      drinking_location_preference: [],
      drinking_capacity: '',
      alcohol_tolerance: '',
      drinking_behavior: [],
      partner_tolerance: [],
      favorite_alcohol: {}
    }
  })
 

  const nextStep = () => {
    setStep((prev) => Math.min(prev + 1, totalSteps))
  }

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1))
  }

  return (
    <div className="min-h-screen flex flex-col">
      <FormProvider {...methods}>
        {step === 0 ? (
          <div className="flex-1 container max-w-lg mx-auto px-4 py-8 flex flex-col">
            <WelcomeStep onNext={() => setStep(1)} />
          </div>
        ) : (
          <div className="flex-1 container max-w-lg mx-auto px-4 py-8 flex flex-col">
            {/* Progress Bar */}
            <div className="w-full">
              <div className="flex items-center mb-2">
                {step > 1 && (
                  <button onClick={prevStep} className="p-2 -ml-2">
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                )}
                <div className="flex-1 text-center text-sm text-gray-400">
                  {step}/{totalSteps}
                </div>
              </div>
              <div className="relative w-full h-1 bg-gray-600 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: `${(step / totalSteps) * 100}%` }}
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-pink-500 to-purple-600"
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              <QuestionStep
                key={step}
                question={questions[step]}
                nextStep={nextStep}
                prevStep={prevStep}
              />
            </AnimatePresence>
          </div>
        )}
      </FormProvider>
    </div>
  )
}

// 質問表示コンポーネント
function QuestionStep({ question, onNext, nextStep, prevStep }: { question: Question; onNext?: () => void; nextStep: () => void; prevStep: () => void }) {
  const { register, watch } = useFormContext()
  const value = watch(question.id)
  const [isValid, setIsValid] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full flex flex-col h-[calc(100vh-100px)]"
    >
      <h1 className="text-2xl font-bold mt-6 mb-6">{question.title}</h1>

      <div className="flex-1 overflow-y-auto pb-24">
        <QuestionRenderer 
          question={question} 
          register={register} 
          value={value}
          setIsValid={setIsValid}
          questions={Object.values(questions)}
          currentQuestionId={question.id}
          onPrevious={prevStep}
          nextStep={nextStep}
          isValid={isValid}
          redirectUrl="/register/favorite_alcohol"
        />

        {question.warning && (
          <div className="text-sm text-gray-400 space-y-2 mt-4">
            {question.warning.map((text, index) => (
              <p key={index}>{text}</p>
            ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/80 backdrop-blur-sm">
        <div className="container max-w-lg mx-auto">
          <Button
            onClick={() => onNext?.()}
            disabled={!isValid}
            className="w-full h-14 text-lg font-medium bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
          >
            次へ
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

