"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useForm, FormProvider, useFormContext } from "react-hook-form"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { doc, updateDoc } from "firebase/firestore"
import { auth, db } from "../firebase/config"

type FormData = {
  gender: string
  birthdate: string
  location: string
  nickname: string
}

// 質問のタイプ定義を拡張
type QuestionType = 'radio' | 'date' | 'text' | 'textarea' | 'number' | 'checklist'

interface Question {
  id: string;
  title: string;
  type: QuestionType;
  options?: string[];
  description?: string;
  warning?: string[];
  required?: boolean;
  min?: number;
  max?: number;
}

// 質問データ
const questions: Record<number, Question> = {
  1: {
    id: "gender",
    title: "性別を教えてください",
    options: ["男性", "女性"],
    type: "radio",
    warning: ["※登録した性別は変更できません"]
  },
  2: {
    id: "birthdate",
    title: "生年月日を教えてください",
    type: "date",
    warning: [
      "※登録した生年月日は変更できません",
      "※誤って登録すると、メッセージのやりとりができませんのでお間違えのないように入力してください"
    ]
  },
  3: {
    id: "location",
    title: "お住まいはどこですか？",
    options: [
      "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
      "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
      "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
      "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
      "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
      "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
      "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
    ],
    type: "radio"
  },
  4: {
    id: "nickname",
    title: "ニックネームを入力してください",
    type: "text",
    warning: [
      "※本名などあなたを特定できる情報は登録できません",
      "※ニックネームはいつでも変更ができます"
    ]
  }
}

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const methods = useForm<FormData>({
    defaultValues: {
      gender: '',
      birthdate: '',
      location: '',
      nickname: ''
    }
  })
  const { handleSubmit, watch } = methods

  // デバッグ用
  console.log('Current form values:', watch())

  const onSubmit = async (data: FormData) => {
    if (!auth.currentUser) {
      console.error("ユーザーが認証されていません")
      return
    }

    try {
      const userData = {
        gender: data.gender,      // 性別
        birthday: data.birthdate, // 生年月日
        address: data.location,   // お住い
        name: data.nickname,      // ニックネーム
        profileCompleted: true
      }

      // デバッグ用のログ
      console.log('保存するユーザー情報:', {
        性別: userData.gender,
        生年月日: userData.birthday,
        お住い: userData.address,
        ニックネーム: userData.name
      })

      // undefined値を除外
      Object.keys(userData).forEach(key => 
        (userData as any)[key] === undefined && delete (userData as any)[key]
      )

      await updateDoc(doc(db, "users", auth.currentUser.uid), userData)
      router.push(`/register/way_of_drinking`)
    } catch (error) {
      console.error("プロフィールの更新に失敗しました:", error)
      alert("プロフィールの更新に失敗しました。もう一度お試しください。")
    }
  }

  const handleFinalStep = () => {
    handleSubmit(onSubmit)()
  }

  const nextStep = () => {
    setStep((prev) => Math.min(prev + 1, 4))
  }

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1))
  }

  const isLastStep = step === 4

  return (
    <FormProvider {...methods}>
      <div className="min-h-screen bg-black text-white flex flex-col overflow-y-auto">
        {/* Progress Bar */}
        <div className="w-full px-4 pt-8">
          <div className="flex items-center mb-2">
            {step > 1 && (
              <button onClick={prevStep} className="p-2 -ml-2">
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            <div className="flex-1 text-center text-sm text-gray-400">{step}/4</div>
          </div>
          <div className="relative w-full h-1 bg-gray-600 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: `${(step / 4) * 100}%` }}
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-pink-500 to-purple-600"
            />
          </div>
        </div>

        <div className="flex-1 px-4 flex overflow-scroll">
          <AnimatePresence mode="wait">
            <QuestionStep 
              key={step} 
              question={questions[step]} 
              onNext={step === 4 ? handleFinalStep : nextStep} 
            />
          </AnimatePresence>
        </div>
        <div className="w-full mt-auto py-4">
          <Button
            onClick={isLastStep ? handleFinalStep : nextStep}
            disabled={!watch(questions[step].id)}
            className="w-full h-14 text-lg font-medium bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
          >
            次へ
          </Button>
        </div>
      </div>
    </FormProvider>
  )
}

// 質問表示コンポーネント
function QuestionStep({ question, onNext }: { question: Question; onNext: () => void }) {
  const { register, watch } = useFormContext()
  const value = watch(question.id)

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full flex flex-col"
    >
      <h1 className="text-2xl font-bold mt-6">{question.title}</h1>

      <QuestionRenderer 
        question={question} 
        register={register} 
        value={value} 
      />

      {question.warning && (
        <div className="text-sm text-gray-400 space-y-2">
          {question.warning.map((text, index) => (
            <p key={index}>{text}</p>
          ))}
        </div>
      )}


    </motion.div>
  )
}

// 質問表示コンポーネント
function QuestionRenderer({ 
  question, 
  register, 
  value 
}: { 
  question: Question;
  register: any;
  value: any;
}) {
  switch (question.type) {
    case 'radio':
      return (
        <div className="space-y-4">
          {question.options?.map((option) => (
            <label
              key={option}
              className="flex items-center space-x-4 rounded-lg border-2 border-gray-800 p-4 hover:bg-white/5 transition-colors cursor-pointer"
            >
              <input
                type="radio"
                value={option}
                {...register(question.id)}
                className="w-6 h-6 border-2 border-white rounded-full"
              />
              <span className="text-lg">{option}</span>
            </label>
          ))}
        </div>
      )

    case 'checklist':
      return (
        <div className="space-y-4">
          {question.options?.map((option) => (
            <label
              key={option}
              className="flex items-center space-x-4 rounded-lg border-2 border-gray-800 p-4 hover:bg-white/5 transition-colors cursor-pointer"
            >
              <input
                type="checkbox"
                value={option}
                {...register(question.id)}
                className="w-6 h-6 sshrink-0 border-2 border-white rounded"
              />
              <span className="text-lg">{option}</span>
            </label>
          ))}
        </div>
      )

    case 'date':
      return (
        <Input
          type="date"
          {...register(question.id)}
          className="w-full bg-transparent border-2 border-gray-800 p-4 text-xl"
        />
      )

    case 'number':
      return (
        <Input
          type="number"
          min={question.min}
          max={question.max}
          {...register(question.id)}
          className="w-full bg-transparent border-2 border-gray-800 p-4 text-xl"
        />
      )

    case 'textarea':
      return (
        <textarea
          {...register(question.id)}
          className="w-full bg-transparent border-2 border-gray-800 p-4 text-xl min-h-[150px] rounded"
          placeholder={question.description}
        />
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

