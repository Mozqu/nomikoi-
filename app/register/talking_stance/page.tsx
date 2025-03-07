"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useForm, FormProvider, useFormContext } from "react-hook-form"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { doc, setDoc, updateDoc } from "firebase/firestore"
import { auth, db } from "@/app/firebase/config"
import { QuestionRenderer } from "@/app/components/question-renderer"
import type { Question, radioItem } from "@/types/questions"
import { Island_Moments } from "next/font/google"

type FormData = {

  talking_stance: string;
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
    id: "talking_stance",
    title: "会話スタンスは？",
    options: {
      "よく話す": 1,
      "聞き上手": 2,
      "合わせ上手": 3,
      "無口": 4,
      "酔ったら喋る": 5
    } as radioItem,
    type: "radio"
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
        最後に<br />
        あなたの会話スタンスを教えて<br />
        
      </h1>
      <p className="text-gray-400">
        質問に答えていくと、自動的にプロフィールが作成されます。
      </p>
      <div className="w-full mt-auto py-4">
        <Button
          onClick={onNext}
          className="w-full h-14 text-lg font-medium bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
        >
          スタンスを入力する
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
      talking_stance: ''
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

const handleSubmitForm = async (data: any, redirectUrl: string, isLastStep: boolean, router: any) => {
  console.log("handleSubmit", data)
  if (!auth.currentUser) {
    console.error("ユーザーがログインしていません");
    return;
  }

  const { alcoholPreferences = {} } = data;  // デフォルト値を設定

  try {
    // DB構造に合わせてデータを整形
    const answers = {
      talking_stance: data.talking_stance || ''
    }

    if (auth.currentUser && isLastStep) {

      const userData = {
        answers,
        drinkingProfileCompleted: true,
        updatedAt: new Date()
      }

      // Firebaseにデータを保存
      const userDocRef = doc(db!, 'users', auth.currentUser.uid);
      await setDoc(userDocRef, userData, { merge: true });
      
      console.log("データが正常に保存されました"); // デバッグ用

      router.push(redirectUrl);

    }
  } catch (error) {
    console.error("データの保存に失敗しました:", error); // エラーの詳細を確認
    alert("プロフィールの更新に失敗しました。もう一度お試しください。")
  }
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
  const { register, watch } = useFormContext()  // methodsの代わりにuseFormContextを使用
  const value = watch(question.id)
  const [isValid, setIsValid] = useState(false)
  const totalSteps = Object.keys(questions).length
  const currentQuestionNumber = Object.entries(questions).find(
    ([_, q]) => q.id === question.id
  )?.[0]
  const isLastStep = Number(currentQuestionNumber) === totalSteps
  const router = useRouter()

  const formData = watch();
  useEffect(() => {
    console.log(formData)
  }, [formData])
      
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full flex flex-col h-[calc(100vh-100px)]"
    >
      <h1 className="text-2xl font-bold mt-6 mb-6">{question.title}</h1>

      <div className="flex-1 overflow-y-auto pb-24">
      <div className="space-y-4">
          {Object.entries(question.options as radioItem).map(([label, value], index) => {
            const uniqueKey = `${question.id}-radio-${label}-${index}`;
            return (
              
              <label
                key={uniqueKey}
                className="flex items-center space-x-4 rounded-lg border-2 border-gray-800 p-3 hover:bg-white/5 transition-colors cursor-pointer"
              >
                <input
                  type="checkbox"
                  value={value}
                  {...register(question.id, {
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                      setIsValid(!!e.target.value);
                    }
                  })}
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
                  console.log(watch())
                  if (isLastStep) {
                    const formData = watch();
                    await handleSubmitForm(formData, '/register/upload-profile-images', isLastStep, router);
                  } else {
                    console.log(formData)
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

        {question.warning && (
          <div className="text-sm text-gray-400 space-y-2 mt-4">
            {question.warning.map((text, index) => (
              <p key={index}>{text}</p>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

