"use client"

import { useState, useCallback, useMemo, memo, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useForm, FormProvider, useFormContext } from "react-hook-form"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { doc, setDoc } from "firebase/firestore"
import { auth, db } from "@/app/firebase/config"
import { QuestionRenderer } from "@/app/components/question-renderer"
import type { Question, radioItem } from "@/types/questions"
import { Island_Moments } from "next/font/google"


type FormData = {
  drink_turns_red: string;
  drink_until_blackout: string;
  forget_after_drinking: string;
  overdrink_often: string;
  talk_to_neighbors: string;
  sleepy_after_drinking: string;
  lose_items_when_drunk: string;
  negative_emotions_when_drunk: string;
  cry_when_drunk: string;
  laugh_uncontrollably_when_drunk: string;
  regret_texting_when_drunk: string;
}


// 質問データ
const questions: Record<number, Question> = {

    1: {
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
    2: {
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
    3:   {
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
    4:   {
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
    5:   {
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
    6:   {
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
    7:   {
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
    8:   {
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
    9:  {
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
    10:  {
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
    11:  {
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
  
  // methodsの定義を先に
  const methods = useForm<FormData>({
    defaultValues: {
      drink_turns_red: '',
      drink_until_blackout: '',
      forget_after_drinking: '',
      overdrink_often: '',
      talk_to_neighbors: '',
      sleepy_after_drinking: '',
      lose_items_when_drunk: '',
      negative_emotions_when_drunk: '',
      cry_when_drunk: '',
      laugh_uncontrollably_when_drunk: '',
      regret_texting_when_drunk: ''
    }
  })
  
  // watchとhandleSubmitをmethodsから取得
  const { watch, handleSubmit } = methods

  // 開発環境でのみデバッグログを表示

  const nextStep = (redirectUrl?: string) => {
    if (step === totalSteps) {

    } else {
      setStep((prev) => Math.min(prev + 1, totalSteps))
    }
  }

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1))
  }



  return (
    <FormProvider {...methods}>
      <div className="min-h-screen flex flex-col">
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
      </div>
    </FormProvider>
  )
}

const handleSubmitForm = async (data: any, redirectUrl: string, isLastStep: boolean, router: any) => {
  console.log("handleSubmit", data)
  if (!auth.currentUser) {
    console.error("ユーザーがログインしていません");
    return;
  }

  const { alcoholPreferences = {} } = data;

  try {
    // DB構造に合わせてデータを整形
    const answers = {
      acceptable_drinking_habit: Object.fromEntries(
        Object.entries({
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
    }

    if (auth.currentUser && isLastStep) {
      const userData = {
        answers,
        drinkingProfileCompleted: true,
        updatedAt: new Date()
      }
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userDocRef, userData, { merge: true });
      
      console.log("データが正常に保存されました");

      router.push(redirectUrl);
    }
  } catch (error) {
    console.error("データの保存に失敗しました:", error);
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
  const router = useRouter() // ここでuseRouterを使用

  const formData = watch();


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
                    type="radio"
                    value={value}
                    onClick={() => {
                      console.log(isValid);
                    }}
                    {...register(question.id, {
                      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                        setIsValid(!!e.target.value);
                      }
                    })}
                    id={question.id + "-radio"}
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
                          await handleSubmitForm(formData, '/profile/' + auth?.currentUser?.uid, isLastStep, router);
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

