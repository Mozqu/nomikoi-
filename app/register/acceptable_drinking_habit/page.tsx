'use client'

import { useState, useCallback, useMemo, memo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/app/firebase/config";
import { doc, setDoc, addDoc, collection } from "firebase/firestore";
import { Users } from "lucide-react";

// 質問の型定義を変更
type Question = {
    id: string;
    title: string;
    options: {
        [key: string]: number;
    };
    type: string;
};

// オプションの型定義を変更
type SelectedOptions = {
    [key: string]: string;
};

// オプションの型定義
type OptionKey = 'A' | 'B' | 'C';

const questions: Record<number, Question> = {
  1: {
    id: "drink_non_drinker",
    title: "お酒が飲めない相手でも、テンションが合えば一緒に楽しめる。",
    options: {
      "全く当てはまらない": 1,
      "あまり当てはまらない": 2, 
      "どちらともいえない": 3,
      "やや当てはまる": 4,
      "よく当てはまる": 5
    },
    type: "radio"
  },
  2: {
    id: "drink_turns_red",
    title: "相手が酔って顔が赤くなっても、気にしない。",
    options: {
      "全く当てはまらない": 1,
      "あまり当てはまらない": 2,
      "どちらともいえない": 3,
      "やや当てはまる": 4,
      "よく当てはまる": 5
    },
    type: "radio"
  },
  3: {
    id: "drink_gets_sleepy",
    title: "途中で眠くなるタイプでも受け入れられる。",
    options: {
        "全く当てはまらない": 1,
      "あまり当てはまらない": 2,
      "どちらともいえない": 3,
      "やや当てはまる": 4,
      "よく当てはまる": 5
    },
    type: "radio"
  },
  4: {
    id: "drink_gets_wasted",
    title: "泥酔するまで飲むタイプでも、対応できる方だと思う。",
    options: {
      "全く当てはまらない": 5,
      "あまり当てはまらない": 4,
      "どちらともいえない": 3,
      "やや当てはまる": 2,
      "よく当てはまる": 1
    },
    type: "radio"
  },
  5: {
    id: "drink_until_blackout",
    title: "潰れるまで飲むタイプでも対応できる方だと思う。",
    options: {
      "全く当てはまらない": 5,
      "あまり当てはまらない": 4,
      "どちらともいえない": 3,
      "やや当てはまる": 2,
      "よく当てはまる": 1
    },
    type: "radio"
  },
  6: {
    id: "drink_forgets_after",
    title: "記憶をなくすタイプでも、それを許せる方だと思う。",
    options: {
      "全く当てはまらない": 1,
      "あまり当てはまらない": 2,
      "どちらともいえない": 3,
      "やや当てはまる": 4,
      "よく当てはまる": 5
    },
    type: "radio"
  },
  7: {
    id: "drink_loses_memory",
    title: "相手が物を失くすタイプでも、許せる方だと思う。",
    options: {
      "全く当てはまらない": 5,
      "あまり当てはまらない": 4,
      "どちらともいえない": 3,
      "やや当てはまる": 2,
      "よく当てはまる": 1
    },
    type: "radio"
  },
  8: {
    id: "drink_laughs_hard",
    title: "酔って笑いが止まらなくなるタイプでも楽しめると思う。",
    options: {
      "全く当てはまらない": 1,
      "あまり当てはまらない": 2,
      "どちらともいえない": 3,
      "やや当てはまる": 4,
      "よく当てはまる": 5
    },
    type: "radio"
  },
  9: {
    id: "drink_talks_to_others",
    title: "酔って店員や隣の客に絡んでもその場を楽しめると思う。",
    options: {
      "全く当てはまらない": 1,
      "あまり当てはまらない": 2,
      "どちらともいえない": 3,
      "やや当てはまる": 4,
      "よく当てはまる": 5
    },
    type: "radio"
  },
  10: {
    id: "drink_gets_angry",
    title: "酔った相手の感情が爆発しても、冷静に対応できると思う。",
    options: {
      "全く当てはまらない": 1,
      "あまり当てはまらない": 2,
      "どちらともいえない": 3,
      "やや当てはまる": 4,
      "よく当てはまる": 5
    },
    type: "radio"
  },
  11: {
    id: "drink_cries",
    title: "泣き上戸でも、優しく対応できる方だと思う。",
    options: {
      "全く当てはまらない": 1,
      "あまり当てはまらない": 2,
      "どちらともいえない": 3,
      "やや当てはまる": 4,
      "よく当てはまる": 5
    },
    type: "radio"
  },
  12: {
    id: "drink_contacts_others",
    title: "酔ってしつこく連絡されても気にしない。",
    options: {
      "全く当てはまらない": 1,
      "あまり当てはまらない": 2,
      "どちらともいえない": 3,
      "やや当てはまる": 4,
      "よく当てはまる": 5
    },
    type: "radio"
  },
  13: {
    id: "drink_outdoor_enjoy",
    title: "パートナーと屋外などの公共スペースでの飲酒を一緒に楽しめる。",
    options: {
      "全く当てはまらない": 1,
      "あまり当てはまらない": 2,
      "どちらともいえない": 3,
      "やや当てはまる": 4,
      "よく当てはまる": 5
    },
    type: "radio"
  }
};  

// Optionコンポーネントを修正
const Option = memo(({ 
  questionKey, 
  optionLabel,
  optionValue, 
  isSelected, 
  onSelect 
}: { 
  questionKey: string; 
  optionLabel: string;
  optionValue: number;
  isSelected: boolean; 
  onSelect: (questionKey: string, optionLabel: string) => void;
}) => {
  return (
    <div 
      className={`p-3 rounded-lg cursor-pointer transition-all ${isSelected ? 'neon-bg' : 'border-gray-300 hover:border-purple-300'}`}
      onClick={() => onSelect(questionKey, optionLabel)}
    >
      <input 
        className="hidden" 
        type="radio" 
        id={`key-${questionKey}-${optionLabel}`} 
        name={questionKey} 
        value={optionValue}
        checked={isSelected}
        onChange={() => {}}
      />
      <label 
        htmlFor={`key-${questionKey}-${optionLabel}`} 
        className="flex items-center cursor-pointer w-full"
      >
        <span className={`w-5 h-5 rounded-full mr-3 border flex items-center justify-center ${isSelected ? 'bg-white' : 'border-gray-400'}`}>
          {isSelected && <span className="text-black text-xs">✓</span>}
        </span>
        {optionLabel}
      </label>
    </div>
  );
});

Option.displayName = 'Option';

// QuestionItemコンポーネントを修正
const QuestionItem = memo(({ 
  questionKey, 
  question, 
  selectedOption, 
  onOptionSelect,
  isActive,
  onQuestionClick,
  ref
}: { 
  questionKey: string; 
  question: Question; 
  selectedOption?: string; 
  onOptionSelect: (questionKey: string, optionLabel: string) => void;
  isActive: boolean;
  onQuestionClick: () => void;
  ref?: React.RefObject<HTMLDivElement>;
}) => {
  return (
    <div 
      ref={ref}
      onClick={() => onQuestionClick()}
      className={`flex flex-col items-center justify-center p-4 w-full max-w-md min-h-[300px] 
        transition-all duration-300 
        ${isActive ? 'opacity-100 scale-100' : 'opacity-50 hover:opacity-75 cursor-pointer scale-95'}
        `}
    >
      <p className="text-l font-bold mb-3">{question.title}</p>
      <div className="flex flex-col gap-2 w-full" onClick={e => e.stopPropagation()}>
        {Object.entries(question.options).map(([optionLabel, optionValue]) => (
          <Option
            key={`${questionKey}-${optionLabel}`}
            questionKey={questionKey}
            optionLabel={optionLabel}
            optionValue={optionValue}
            isSelected={selectedOption === optionLabel}
            onSelect={onOptionSelect}
          />
        ))}
      </div>
    </div>
  );
});

QuestionItem.displayName = 'QuestionItem';

export default function acceptableDrinkingHabit() {
  const router = useRouter();
  const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 質問要素への参照を保持
  const questionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const userDocRef = doc(db, "users", auth.currentUser.uid);
  console.log("===============")
  console.log(userDocRef);

  
  // 質問リストのメモ化
  const questionEntries = useMemo(() => Object.entries(questions), []);

  // 特定の質問にスクロール
  const scrollToQuestion = useCallback((index: number) => {
    const questionElement = questionRefs.current[index];
    if (questionElement) {
      questionElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
      setCurrentQuestionIndex(index);
    }
  }, []);

  // 質問クリックハンドラ
  const handleQuestionClick = useCallback((index: number) => {
    scrollToQuestion(index);
  }, [scrollToQuestion]);

  // 次の質問へスクロール
  const scrollToNextQuestion = useCallback((currentIndex: number) => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < questionEntries.length) {
      scrollToQuestion(nextIndex);
    }
  }, [questionEntries.length, scrollToQuestion]);

  // スクロール監視の改善
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      // スクロール中は処理をスキップ
      clearTimeout(scrollTimeout);
      
      scrollTimeout = setTimeout(() => {
        const middleOfScreen = window.innerHeight / 2;
        let closestQuestion = 0;
        let minDistance = Infinity;

        questionRefs.current.forEach((ref, index) => {
            if (ref) {
                const rect = ref.getBoundingClientRect();
                const distance = Math.abs(rect.top + (rect.height / 2) - middleOfScreen);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestQuestion = index;
                }
            }
        });

        setCurrentQuestionIndex(closestQuestion);
      }, 100); // スクロール終了後100msで実行
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  // オプション選択ハンドラを修正
  const handleOptionChange = useCallback((questionKey: string, optionLabel: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [questionKey]: optionLabel
    }));
    
    const currentIndex = questionEntries.findIndex(([key]) => key === questionKey);
    scrollToNextQuestion(currentIndex);
  }, [questionEntries, scrollToNextQuestion]);

  // 回答送信ハンドラ
  const handleSubmit = useCallback(async () => {
    if (!auth?.currentUser) {
      setError("ユーザー認証が必要です");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const answersData = Object.entries(selectedOptions).reduce((acc, [key, option]) => {
        const questionNumber = parseInt(key);
        const questionData = questions[questionNumber];
        
        if (questionData) {
          acc[questionNumber] = {
            id: questionData.id,
            value: questionData.options[option] || 0
          };
        }
        return acc;
      }, {} as Record<string, any>);

      console.log(answersData);

      // 現在のユーザーのドキュメントを取得して更新
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      console.log(userDocRef);
      await setDoc(userDocRef, {
        userId: auth.currentUser.uid,
        answers: {
          acceptable_drinking_habit: answersData
        },
        timestamp: new Date(),
        status: 'pending'
      }, { merge: true });
      
      // 確認ページへリダイレクト
      router.push(`/settings`);

    } catch (error) {
      console.error("回答の保存に失敗しました:", error);
      setError("回答の保存に失敗しました。もう一度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedOptions, router]);

  // 全ての質問に回答されたかチェック
  const isAllQuestionsAnswered = useMemo(() => {
    return questionEntries.length > 0 && 
           questionEntries.every(([key]) => selectedOptions[key] !== undefined);
  }, [questionEntries, selectedOptions]);

  // 初期表示時に1問目を中央に表示
  useEffect(() => {
    // ページ読み込み直後に実行
    const timer = setTimeout(() => {
      const firstQuestion = questionRefs.current[0];
      if (firstQuestion) {
        firstQuestion.scrollIntoView({
          behavior: 'instant', // スムーズスクロールを無効化
          block: 'center'
        });
        // スクロール位置をリセット（ページ読み込み時の自動スクロールを防ぐ）
        window.scrollTo(0, window.scrollY);
      }
    }, 100); // わずかな遅延を設定

    return () => clearTimeout(timer);
  }, []); // 初回レンダリング時のみ実行

  return (
    <div className="flex flex-col items-center justify-start min-h-screen py-8 px-4">
      <h1 className="text-2xl font-bold mb-6 backdrop-blur-sm z-10 py-4 w-full text-center border-b border-gray-200">
        フィルタリング診断
      </h1>
      
      <div className="w-full max-w-md space-y-8 mt-4 overflow-y-auto">
        {questionEntries.map(([key, question], index) => (
          <QuestionItem
            key={key}
            ref={el => questionRefs.current[index] = el}
            questionKey={key}
            question={question}
            selectedOption={selectedOptions[key]}
            onOptionSelect={handleOptionChange}
            isActive={index === currentQuestionIndex}
            onQuestionClick={() => handleQuestionClick(index)}
          />
        ))}
      </div>
      
      {/* 進捗インジケーター */}
      <div className="fixed right-4 top-1/2 transform -translate-y-1/2">
        <div className="flex flex-col gap-2">
          {questionEntries.map((_, index) => (
            <div
              key={index}
              onClick={() => handleQuestionClick(index)}
              className={`w-3 h-3 rounded-full cursor-pointer transition-all
                `}
            />
          ))}
        </div>
      </div>
      
      {error && (
        <div className="w-full max-w-md mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <div className="w-full max-w-md mt-8 sticky bottom-4">
        <button
          onClick={handleSubmit}
          disabled={!isAllQuestionsAnswered || isSubmitting}
          className={`w-full p-4 rounded-lg transition-all ${
            isAllQuestionsAnswered && !isSubmitting
              ? 'neon-bg text-white' 
              : 'neon-bg opacity-50 cursor-not-allowed'
          }`}
        >
          {isSubmitting 
            ? '送信中...' 
            : isAllQuestionsAnswered 
              ? '診断結果を見る' 
              : '全ての質問に回答してください'}
        </button>
      </div>
    </div>
  );
}
