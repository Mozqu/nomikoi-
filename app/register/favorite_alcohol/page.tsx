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
import type { Question, QuestionType } from "@/types/questions"
import { checkListItem, radioItem, toggleListItem } from "@/types/questions"

type QuestionOption = {
  label: string;
  value: number;
};

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

// optionsの型を変換する関数
const convertOptions = (options: Record<string, number>): QuestionOption[] => {
  return Object.entries(options).map(([label, value]) => ({
    label,
    value
  }))
}

// 質問データ
const questions: Record<number, Question> = {
    1: {
        "id": "drinking_location_preference",
        "title": "飲み会の場所は？",
        "options": [
          "場末・立ち飲み居酒屋",
          "ファミレス",
          "大衆系レストラン・居酒屋",
          "おしゃれ系レストラン・居酒屋",
          "レストラン系",
          "高級系（フレンチ）",
          "クラブ系",
          "オーセンティックバー",
          "エンタメ系",
          "スナック",
          "カラオケ",
          "アミューズメント施設（遊園地、動物園）",
          "スパ・温泉併設の呑み処",
          "アウトドア呑み（BBQ・キャンプ）",
          "フェス・イベント会場",
          "オンライン呑み"
        ],
        "type": "checklist" as QuestionType,
      },
    2: {
        id: "favorite_alcohol",
        title: "好きなお酒を教えてください",
        type: "toggleList" as QuestionType,
        options: [
        {
            name: "特にこだわりなし",
            subtypes: []
        },
        {
            name: "ビール",
            subtypes: ["生ビール", "クラフトビール", "黒ビール", "ベルギービール", "ノンアルビール"]
        },
        {
            name: "ワイン",
            subtypes: ["赤ワイン", "白ワイン", "ロゼワイン", "スパークリングワイン", "シャンパン", "サングリア"]
        },
        {
            name: "日本酒",
            subtypes: ["純米酒", "大吟醸", "にごり酒", "生酒", "冷酒", "熱燗"]
        },
        {
            name: "焼酎",
            subtypes: ["芋焼酎", "麦焼酎", "米焼酎", "黒糖焼酎", "泡盛", "しそ焼酎"]
        },
        {
            name: "ウイスキー",
            subtypes: ["シングルモルト", "ブレンデッド", "バーボン", "アイリッシュ", "ジャパニーズ", "ハイボール"]
        },
        {
            name: "ブランデー",
            subtypes: ["コニャック", "アルマニャック", "カルヴァドス"]
        },
        {
            name: "カクテル",
            subtypes: ["ジン系", "ウォッカ系", "ラム系", "テキーラ系", "リキュール系"]
        },
        {
            name: "酎ハイ・サワー",
            subtypes: [
            "レモンサワー", "グレープフルーツサワー", "ライムサワー", "梅サワー",
            "カルピスサワー", "緑茶ハイ", "ウーロンハイ", "ゆずサワー"
            ]
        },
        {
            name: "アジアンお酒",
            subtypes: ["紹興酒", "マッコリ", "白酒", "ホッピー"]
        }
        ] as const as toggleListItem[]
    },
    3: {
        id: "dislike_alcohol",
        title: "嫌いなお酒を教えてください",
        type: "toggleList" as QuestionType,
        options: [
            {
            name: "特にこだわりなし",
            subtypes: []
            },
            {
            name: "ビール",
            subtypes: ["生ビール", "クラフトビール", "黒ビール", "ベルギービール", "ノンアルビール"]
            },
            {
            name: "ワイン",
            subtypes: ["赤ワイン", "白ワイン", "ロゼワイン", "スパークリングワイン", "シャンパン", "サングリア"]
            },
            {
            name: "日本酒",
            subtypes: ["純米酒", "大吟醸", "にごり酒", "生酒", "冷酒", "熱燗"]
            },
            {
            name: "焼酎",
            subtypes: ["芋焼酎", "麦焼酎", "米焼酎", "黒糖焼酎", "泡盛", "しそ焼酎"]
            },
            {
            name: "ウイスキー",
            subtypes: ["シングルモルト", "ブレンデッド", "バーボン", "アイリッシュ", "ジャパニーズ", "ハイボール"]
            },
            {
            name: "ブランデー",
            subtypes: ["コニャック", "アルマニャック", "カルヴァドス"]
            },
            {
            name: "カクテル",
            subtypes: ["ジン系", "ウォッカ系", "ラム系", "テキーラ系", "リキュール系"]
            },
            {
            name: "酎ハイ・サワー",
            subtypes: [
                "レモンサワー", "グレープフルーツサワー", "ライムサワー", "梅サワー",
                "カルピスサワー", "緑茶ハイ", "ウーロンハイ", "ゆずサワー"
            ]
            },
            {
            name: "アジアンお酒",
            subtypes: ["紹興酒", "マッコリ", "白酒", "ホッピー"]
            }
        ] as const as toggleListItem[]  
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
        次に、あなたの好みについて教えて下さい！
      </h1>
      <p className="text-gray-400">
        
      </p>
      <div className="w-full mt-auto py-4">
        <Button
          onClick={onNext}
          className="w-full h-14 text-lg font-medium bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
        >
          好みを入力する
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
  const { handleSubmit, watch } = methods

  // 開発環境でのみデバッグログを表示
  if (process.env.NODE_ENV === 'development') {

}

  const nextStep = () => {
    if (step === totalSteps && questions[step].type === 'toggleList') {
      handleSubmit((data: FormData) => {})()
      return
    }
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
                onNext={step === totalSteps ? () => handleSubmit((data) => router.push('/register/acceptable_drinking_habit'))() : nextStep}
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
function QuestionStep({ 
  question, 
  onNext,
  nextStep,
  prevStep 
}: { 
  question: Question; 
  onNext?: () => void;
  nextStep: () => void;
  prevStep: () => void;
}) {
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
          onSubmit={onNext}
          questions={Object.values(questions)}
          currentQuestionId={question.id}
          onPrevious={prevStep}
          onNext={nextStep}
          isValid={isValid}
          redirectUrl="/register/acceptable_drinking_habit"
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
            disabled={!isValid && !value}
            className="w-full h-14 text-lg font-medium bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
          >
            次へ
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

