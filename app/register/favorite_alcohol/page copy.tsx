"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useForm, FormProvider, useFormContext } from "react-hook-form"
import { ChevronLeft, Heart, X, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { doc, setDoc, updateDoc } from "firebase/firestore"
import { auth, db } from "@/app/firebase/config"
import { QuestionRenderer } from "@/app/components/question-renderer"
import type { Question, QuestionType } from "@/types/questions"
import { checkListItem, radioItem, toggleListItem } from "@/types/questions"
import { watch } from "fs"

type QuestionOption = {
  label: string;
  value: number;
};

type FormData = {
  drinking_location_preference: string[];
  favorite_alcohol: Record<string, { 
    subtypes: Record<string, number> 
  }>;
  dislike_alcohol: Record<string, { 
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
        "title": "好きな飲みシュチュエーションは？",
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
            name: "ビール",
            subtypes: ["生ビール", "クラフトビール", "黒ビール", "ベルギービール"]
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
        },
        {
          name: "全部好き！",
          subtypes: []
        },
        {
          name: "どれもOK",
          subtypes: []
        },


        ] as const as toggleListItem[]
    },
    3: {
        id: "dislike_alcohol",
        title: "苦手なお酒を教えてください",
        type: "toggleList" as QuestionType,
        options: [
            {
            name: "特になし",
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
      drinking_location_preference: [],
      favorite_alcohol: {},
      dislike_alcohol: {}
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
                router={router}
              />
            </AnimatePresence>
          </div>
        )}
      </FormProvider>
    </div>
  )
}

const handleSubmitForm = async (data: any, redirectUrl: string, isLastStep: boolean, router: any) => {
  if (!auth.currentUser) {
    console.error("ユーザーがログインしていません");
    return;
  }

  try {
    // データを配列形式に整形
    const answers = {
      favorite_alcohol: {
        drinking_location_preference: data.drinking_location_preference || [],
        favorite_alcohol: Object.keys(data.favorite_alcohol || {}),
        dislike_alcohol: Object.keys(data.dislike_alcohol || [])
      }
    }

    if (auth.currentUser && isLastStep) {
      const userData = {
        answers,
        drinkingProfileCompleted: true,
        updatedAt: new Date()
      }

      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userDocRef, userData, { merge: true });
    }
  } catch (error) {
    console.error("データの保存に失敗しました:", error);
    alert("プロフィールの更新に失敗しました。もう一度お試しください。")
  }
}

interface AlcoholPreference {
  subtypes: Record<string, number>;
}

// 質問表示コンポーネント
function QuestionStep({ 
  question, 
  onNext,
  nextStep,
  prevStep,
  router
}: { 
  question: Question; 
  onNext?: () => void;
  nextStep: () => void;
  prevStep: () => void;
  router: any;
}) {
  const { register, setValue, watch } = useFormContext()
  const value = watch(question.id)
  const [isValid, setIsValid] = useState(false)
  const [openPopup, setOpenPopup] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<string[]>(value || [])
  const [alcoholPreferences, setAlcoholPreferences] = useState<
    Record<string, AlcoholPreference>
  >({})

  useEffect(() => {
    console.log("formdata", FormData)
  }, [FormData])
  //　手動追加分
  const totalSteps = Object.keys(questions).length
  const currentQuestionNumber = Object.entries(questions).find(
    ([_, q]) => q.id === question.id
  )?.[0]
  const isLastStep = Number(currentQuestionNumber) === totalSteps

  useEffect(() => {
    if (question.type === 'checklist') {
      setIsValid(Array.isArray(selectedItems) && selectedItems.length > 0);
    } else if (question.type === 'toggleList') {
      // 特別なオプションの選択状態を確認
      const hasAllOption = alcoholPreferences['全部好き！']?.subtypes !== undefined;
      const hasAnyOption = alcoholPreferences['どれもOK']?.subtypes !== undefined;
      const hasNoOption = alcoholPreferences['特になし']?.subtypes !== undefined;

      
      if (hasAllOption || hasAnyOption) {
        // 「全部好き！」か「どれもOK」が選択されている場合は常に有効
        setIsValid(true);
      } else {
        // それ以外の場合は、通常のバリデーション（何かしらの選択があれば有効）
        const hasSelection = Object.values(alcoholPreferences).some(pref => 
          Array.isArray(pref.subtypes) && pref.subtypes.length > 0
        );
        setIsValid(hasSelection);
      }
    } else if (question.type === 'radio') {
      setIsValid(!!value);
    }
  }, [question.type, selectedItems, alcoholPreferences, value]);

  const toggleMainPreference = (name: string) => {
    const newPreferences = {
      ...alcoholPreferences,
      [name]: {
        subtypes: []  // 空の配列として初期化
      }
    };
    
    setAlcoholPreferences(newPreferences);
    setValue(question.id, newPreferences, { shouldValidate: true });
  }

  const togglePreference = (name: string, subtype: string) => {
    const currentSubtypes = alcoholPreferences[name]?.subtypes || [];
    const newSubtypes = currentSubtypes.includes(subtype)
      ? currentSubtypes.filter(item => item !== subtype)
      : [...currentSubtypes, subtype];
    
    const newPreferences = {
      ...alcoholPreferences,
      [name]: {
        subtypes: newSubtypes  // 文字列の配列として管理
      }
    };

    setAlcoholPreferences(newPreferences);
    setValue(question.id, newPreferences, { shouldValidate: true });
  }

  // デバッグ用のwatchを追加
  useEffect(() => {
    const subscription = watch((value) => {
      console.log('Question値の変更:', {
        questionId: question.id,
        value: value[question.id]
      });
    });
    
    return () => subscription.unsubscribe();
  }, [watch, question.id]);

  // チェックリストの場合の処理も修正
  const handleChecklistChange = (option: string) => {
    const newSelectedItems = selectedItems.includes(option)
      ? selectedItems.filter(item => item !== option)
      : [...selectedItems, option];
    
    setSelectedItems(newSelectedItems);
    setValue(question.id, newSelectedItems, { shouldValidate: true });
  }

  const IconComponent = question.id === 'dislike_alcohol' ? X : Heart;
  const getIconStyle = (questionId: string) => {
    const baseStyle = "fill-current";
    const colorStyle = questionId === 'dislike_alcohol' 
      ? "text-purple-500" 
      : "text-pink-500";
    
    return `${baseStyle} ${colorStyle}`;
  }
  const getBorderStyle = (questionId: string) => {
    const baseStyle = "fill-current";
    const colorStyle = questionId === 'dislike_alcohol' 
      ? "border-purple-500" 
      : "border-pink-500";
    
    return `${colorStyle}`;
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full flex flex-col h-[calc(100vh-100px)]"
    >
      <h1 className="text-2xl font-bold mt-6 mb-6">{question.title}</h1>

      <div className="flex-1 overflow-y-auto pb-24">
        <div className="flex flex-wrap gap-4">
          {question.type === 'checklist' ? (
            // checklistの場合の表示
            question.options.map((option: string, index: number) => {
              const isSelected = selectedItems.includes(option);
              return (
                <button
                  key={`${question.id}-${index}`}
                  type="button"
                  onClick={() => handleChecklistChange(option)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 
                    ${isSelected ? getBorderStyle(question.id) : "border-gray-600 hover:border-gray-400"}
                    transition-colors cursor-pointer`}
                >
                  {option}
                  <IconComponent
                    className={`w-4 h-4 transition-all ${
                      isSelected ? getIconStyle(question.id) : "text-gray-400"
                    }`}
                  />
                </button>
              );
            })
          ) : (
            // toggleListの場合の既存の表示
            (question.options || []).map((option: toggleListItem, index: number) => {
              const uniqueKey = `${question.id}-toggle-${option.name || ''}-${index}`;
              const isSpecialOption = option.name === '全部好き！' || 
                                     option.name === 'どれもOK' || 
                                     option.name === '特になし';
              const isSelected = isSpecialOption 
                ? alcoholPreferences[option.name as string]?.subtypes !== undefined
                : (alcoholPreferences[option.name as string]?.subtypes || []).length > 0;
              return (
                <div key={uniqueKey} className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      if (isSpecialOption) {
                        toggleMainPreference(option.name as string)
                      } else if (option.subtypes?.length) {
                        setOpenPopup(openPopup === option.name ? null : (option.name || ''))
                      }
                    }}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 
                      ${isSelected ? getBorderStyle(question.id) : "border-gray-600 hover:border-gray-400"}
                      ${isSpecialOption ? 'font-bold' : ''}
                      transition-colors cursor-pointer`}
                  >
                    {option.name}
                    {!isSpecialOption && option.subtypes && option.subtypes.length > 0 && (
                      <ChevronDown className={`w-4 h-4 transition-transform ${openPopup === option.name ? 'rotate-180' : ''}`} />
                    )}
                    <IconComponent
                      className={`w-4 h-4 transition-all ${
                        isSelected ? getIconStyle(question.id) : "text-gray-400"
                      }`}
                    />
                  </button>

                  {/* サブタイプのモーダル */}
                  <AnimatePresence>
                    {openPopup === option.name && option.subtypes && (
                      <div className="fixed inset-0 z-[100]" onClick={() => setOpenPopup(null)}>
                        {/* オーバーレイ背景 */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        />

                        {/* モーダルコンテンツ */}
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <div 
                            className="w-[90%] max-w-md p-6 bg-gray-900 rounded-xl shadow-xl border border-gray-700"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex justify-between items-center mb-4">
                              <div className="text-lg font-medium">{option.name}を選択</div>
                              {option.subtypes.length > 0 && (
                                <button
                                  onClick={() => {

                                    const allSelected = option.subtypes.every(
                                      subtype => alcoholPreferences[option.name as string]?.subtypes?.includes(subtype)
                                    );
                                    
                                    const newSubtypes = allSelected ? [] : [...option.subtypes];
                                    const newPreferences = {
                                      ...alcoholPreferences,
                                      [option.name as string]: {
                                        subtypes: newSubtypes
                                      }
                                    };

                                    setAlcoholPreferences(newPreferences);

                                    console.log("formdata", watch())
                                  }}
                                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 
                                    ${
                                      option.subtypes.every(
                                        subtype => alcoholPreferences[option.name as string]?.subtypes?.includes(subtype)
                                      ) ? getBorderStyle(question.id) : "border-gray-600 hover:border-gray-400"}
                                    transition-colors cursor-pointer`}
                                >
                                  {question.id === 'dislike_alcohol' ? "全部苦手" : "全部好き！"}
                                  <IconComponent
                                    className={`w-4 h-4 transition-all ${
                                      option.subtypes.every(
                                        subtype => alcoholPreferences[option.name as string]?.subtypes?.includes(subtype)
                                      ) ? getIconStyle(question.id) : "text-gray-400"
                                    }`}
                                  />
                                </button>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-3 max-h-[60vh] overflow-y-auto">
                              {option.subtypes.map((subtype, subIndex) => {
                                const isSubtypeSelected = alcoholPreferences[option.name as string]?.subtypes?.includes(subtype);
                                return (
                                  <button
                                    key={`${uniqueKey}-sub-${subIndex}`}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      togglePreference(option.name as string, subtype);
                                    }}
                                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 
                                      ${isSubtypeSelected ? getBorderStyle(question.id) : "border-gray-600 hover:border-gray-400"}
                                      transition-colors cursor-pointer`}
                                  >
                                    <span>{subtype}</span>
                                    <IconComponent
                                      className={`w-4 h-4 transition-all ${
                                        isSubtypeSelected ? getIconStyle(question.id) : "text-gray-400"
                                      }`}
                                    />
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })
          )}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/80 backdrop-blur-sm">
            <div className="container max-w-lg mx-auto">
              <Button
                onClick={async () => {
                  console.log("formdata", watch())
                  if (isLastStep) {
                    const formData = watch();
                    await handleSubmitForm(formData, '/register/acceptable_drinking_habit', isLastStep, router);
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

