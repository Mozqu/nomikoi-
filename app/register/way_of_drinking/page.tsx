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
  ideal_drinking_time: string;
  drinking_amount: string;
  drinking_frequency: string;
  food_pairing_importance: string;
  alcohol_quality_preference: string;
  party_drink_preference: string;
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
      "全く飲まない": 0,
      "少量飲む": 1,
      "控えめに飲む": 2,
      "普通に飲む": 3,
      "そこそこ飲む": 4,
      "かなり飲む": 5,
      "非常に多く飲む": 6
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
    "title": "食事との相性は重視する？",
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
    "title": "お酒の味や品質はこだわる？",
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
    "title": "パーティードリンク(ショット等)は楽しめる？",
    "options": {
      "飲みたくない": 1,
      "できれば飲みたくない": 2,
      "流れでたまに飲むのは楽しい": 3,
      "好きな方だ": 4,
      "大好きだ": 5
    },
    "type": "radio"
  },
  7: {
    "id": "smoking_motivation",
    "title": "飲みの席でのあなたの希望は？",
    "options": {
      "喫煙席必須（紙）": 1,
      "喫煙席必須（電子）": 2,
      "できれば喫煙席がいい": 3,
      "吸うけど禁煙席OK": 4,
      "吸わないけど喫煙席OK": 5,
      "できれば禁煙席がいい": 6,
      "禁煙席必須": 7,
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
        質問に答えて<br />
        あなたのプロフィールを<br />
        作成しましょう
      </h1>
      <p className="text-gray-400">
        質問に答えていくと、自動的にプロフィールが作成されます。
      </p>
      <div className="w-full mt-auto py-4">
        <Button
          onClick={onNext}
          className="w-full h-14 text-sm font-medium neon-bg"
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
      drinking_amount: '',
      drinking_frequency: '',
      food_pairing_importance: '',
      alcohol_quality_preference: '',
      party_drink_preference: ''
    }
  })
  const descriptions = [
    "全く飲まない（純アルコール0g）は選択できません",

  ]
 

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
                  className="absolute left-0 top-0 h-full neon-bg"
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
      way_of_drinking: {
        ideal_drinking_time: Number(data.ideal_drinking_time) || 0,
        drinking_amount: Number(data.drinking_amount) || 0,
        drinking_frequency: Number(data.drinking_frequency) || 0,
        food_pairing_importance: Number(data.food_pairing_importance) || 0,
        alcohol_quality_preference: Number(data.alcohol_quality_preference) || 0,
        party_drink_preference: Number(data.party_drink_preference) || 0
      }
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

  const descriptions1 = [
    "",
    "グラス1杯のみ",
    "ビール・ワイン 1～2杯",
    "ビール・ワイン 2～3杯",
    "ビール・ワイン 4～5杯",
    "ビール・ワイン 6～7杯",
    "ビール・ワイン 8杯以上",

  ]

  const descriptions2 = [
    "",
    "",
    "ハイボール・サワー・酎ハイ 2～3杯",
    "ハイボール・サワー・酎ハイ 4～5杯",
    "ハイボール・サワー・酎ハイ 6～8杯",
    "ハイボール・サワー・酎ハイ 9～10杯",
    "ハイボール・サワー・酎ハイ 11杯以上",
  ]
 

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full flex flex-col"
    >
      <h1 className="text-2xl font-bold mt-6 mb-6">{question.title}</h1>

      <div className="flex-1 pb-24 overflow-y-auto">
        <div className="flex flex-col">
          <div className="flex-1 space-y-4">
            {Object.entries(question.options as radioItem).map(([label, value], index) => {
              const uniqueKey = `${question.id}-radio-${label}-${index}`;
              return (
                
                <label
                  key={uniqueKey}
                  className="flex items-center space-x-4 rounded-lg border-2 border-gray-800 p-3 hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <input
                    type="radio"
                    value={value}
                    {...register(question.id, {
                      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                        setIsValid(!!e.target.value);
                      }
                    })}
                    id="test-radio"
                    className="w-5 h-5 border-2 border-white rounded-full accent-pink-500"
                  />
                  <div className={`${question.id === "drinking_amount" ? "flex flex-col"  : ""}`}>
                    <span className="text-sm">{label}</span>
                    {/* 飲酒量の質問の時だけ補足をつける */}
                    {question.id === "drinking_amount" && (               
                      <span className="block text-xs text-gray-400">{descriptions1[index]}</span>
                    )}
                    {question.id === "drinking_amount" && (               
                      <span className="block text-xs text-gray-400">{descriptions2[index]}</span>
                    )}
                  </div>
                </label>
              );
            })}
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
      {/* ボタン */}
      <div className="fixed bottom-0 left-0 right-0 w-full p-4 bg-black/80 backdrop-blur-sm">
        <div className="container max-w-lg mx-auto">
          <Button
            onClick={async () => {
              console.log(watch())
              if (isLastStep) {
                const formData = watch();
                await handleSubmitForm(formData, '/register/favorite_alcohol', isLastStep, router);
              } else {
                console.log(formData)
                nextStep()
              }
            }}
            disabled={!isValid}
            className="w-full h-14 text-sm font-medium bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
          >
            次へ
          </Button>
        </div>
      </div>   

    </motion.div>
  )
}

