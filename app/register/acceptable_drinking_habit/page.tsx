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
import type { Question } from "@/types/questions"

type QuestionType = 'radio' | 'date' | 'text' | 'textarea' | 'number' | 'checklist' | 'checkbox' | 'favorite_alcohol'

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

// 質問データ
const questions: Record<number, Question> = {
    1: {
      "id": "personal_alcohol_strength",
      "title": "自分のお酒の強さを5段階で表すと？",
      "options": {
        "非常に弱い": 1,
        "弱い": 2,
        "普通": 3,
        "強い": 4,
        "非常に強い": 5
      },
      "type": "radio"
    },
    
    2: {
        "id": "drink_turns_red",
        "title": "飲むと赤くなる方だ。",
        "options": {
        "全く当てはまらない": 1,
        "あまり当てはまらない": 2,
        "どちらともいえない": 3,
        "やや当てはまる": 4,
        "非常に当てはまる": 5
        },
        "type": "radio"
    },
    3: {
          "id": "drink_until_blackout",
          "title": "潰れるまで飲むことが最近もある。",
          "options": {
            "全く当てはまらない": 1,
            "あまり当てはまらない": 2,
            "どちらともいえない": 3,
            "やや当てはまる": 4,
            "非常に当てはまる": 5
          },
          "type": "radio"
        },
     4:   {
          "id": "forget_after_drinking",
          "title": "お酒を飲んだ後、記憶をなくすことがあると思う。",
          "options": {
            "全く当てはまらない": 1,
            "あまり当てはまらない": 2,
            "どちらともいえない": 3,
            "やや当てはまる": 4,
            "非常に当てはまる": 5
          },
          "type": "radio"
        },
     5:   {
          "id": "overdrink_often",
          "title": "お酒を飲むとき、つい飲みすぎることがあると思う。",
          "options": {
            "全く当てはまらない": 1,
            "あまり当てはまらない": 2,
            "どちらともいえない": 3,
            "やや当てはまる": 4,
            "非常に当てはまる": 5
          },
          "type": "radio"
        },
     6:   {
          "id": "talk_to_neighbors",
          "title": "飲んだときに隣の客と仲良くなりがちだ。",
          "options": {
            "全く当てはまらない": 1,
            "あまり当てはまらない": 2,
            "どちらともいえない": 3,
            "やや当てはまる": 4,
            "非常に当てはまる": 5
          },
          "type": "radio"
        },
     7:   {
          "id": "sleepy_after_drinking",
          "title": "飲むとすぐ眠くなる方だ。",
          "options": {
            "全く当てはまらない": 1,
            "あまり当てはまらない": 2,
            "どちらともいえない": 3,
            "やや当てはまる": 4,
            "非常に当てはまる": 5
          },
          "type": "radio"
        },
     8:   {
          "id": "lose_items_when_drunk",
          "title": "酔ったときに、物をなくしてしまうことがあると思う。",
          "options": {
            "全く当てはまらない": 1,
            "あまり当てはまらない": 2,
            "どちらともいえない": 3,
            "やや当てはまる": 4,
            "非常に当てはまる": 5
          },
          "type": "radio"
        },
     9:   {
          "id": "negative_emotions_when_drunk",
          "title": "お酒を飲むと怒りなどのマイナス感情が出てきてしまいがちだと思う。",
          "options": {
            "全く当てはまらない": 1,
            "あまり当てはまらない": 2,
            "どちらともいえない": 3,
            "やや当てはまる": 4,
            "非常に当てはまる": 5
          },
          "type": "radio"
        },
      10:  {
          "id": "cry_when_drunk",
          "title": "飲むと泣くことがある。",
          "options": {
            "全く当てはまらない": 1,
            "あまり当てはまらない": 2,
            "どちらともいえない": 3,
            "やや当てはまる": 4,
            "非常に当てはまる": 5
          },
          "type": "radio"
        },
      11:  {
          "id": "laugh_uncontrollably_when_drunk",
          "title": "飲むと笑いが止まらなくなる。",
          "options": {
            "全く当てはまらない": 1,
            "あまり当てはまらない": 2,
            "どちらともいえない": 3,
            "やや当てはまる": 4,
            "非常に当てはまる": 5
          },
          "type": "radio"
        },
      12:  {
          "id": "regret_texting_when_drunk",
          "title": "酔った勢いでSNSや誰かに連絡してしまい、後で後悔することがあると思う。",
          "options": {
            "全く当てはまらない": 1,
            "あまり当てはまらない": 2,
            "どちらともいえない": 3,
            "やや当てはまる": 4,
            "非常に当てはまる": 5
          },
          "type": "radio"
        }
      
  };
  
  

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
  const { handleSubmit, watch } = methods

  // 開発環境でのみデバッグログを表示

  const nextStep = (redirectUrl?: string) => {
    if (step === totalSteps) {
      handleSubmit((data) => {
        router.push('/register/discover')
      })()
    } else {
      setStep((prev) => Math.min(prev + 1, totalSteps))
    }
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
                onNext={nextStep}
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
          redirectUrl="/register/discover"
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

