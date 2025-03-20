'use client'

import { useState, useCallback, useMemo, memo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/app/firebase/config";
import { doc, setDoc, addDoc, collection } from "firebase/firestore";

// questionsオブジェクトに型定義を追加
type Question = {
  question: string;
  factor: string;
  priority_factor: string;
  options: {
    A: { label: string; type: string; value: number };
    B: { label: string; type: string; value: number };
    C: { label: string; type: string; value: number };
  };
};

type Questions = {
  [key: number]: Question;
};

// selectedOptionsの型定義
type SelectedOptions = {
  [key: string]: string;
};

// オプションの型定義
type OptionKey = 'A' | 'B' | 'C';

const questions: Questions = {
    1: {
        question: "飲むペースは...",
        factor: "A/H",
        priority_factor: "H",
        options: {
            A: { label: "周りにペースを合わせることが多い", type: "A", value: 2 },
            B: { label: "自分の飲み方を大事にしたい", type: "H", value: 2 },
            C: { label: "どちらでもない", type: "A", value: 1 }
        }
    },
    2: {
        question: "会話のスタンスは...",
        factor: "E/I",
        priority_factor: "I",
        options: {
            A: { label: "話の中心になることが多い", type: "E", value: 2 },
            B: { label: "聞き役になることが多い", type: "I", value: 2 },
            C: { label: "どちらでもない", type: "I", value: 1 }
        }
    },
    3: {
        question: "飲み会後に反省する...",
        factor: "N/T",
        priority_factor: "N",
        options: {
            A: { label: "飲み会後もあまり振り返らない", type: "N", value: 2 },
            B: { label: "翌日、「大丈夫だったかな」と思うことが多い", type: "T", value: 2 },
            C: { label: "どちらでもない", type: "T", value: 1 }
        }
    },
    4: {
        question: "お店選びは...",
        factor: "O/S",
        priority_factor: "O",
        options: {
            A: { label: "新しい店や知らないエリアを開拓したい", type: "O", value: 2 },
            B: { label: "行き慣れた店・エリアが安心する", type: "S", value: 2 },
            C: { label: "どちらでもない", type: "S", value: 1 }
        }
    },
    5: {
        question: "初対面の人と飲む前は...",
        factor: "N/T",
        priority_factor: "N",
        options: {
            A: { label: "飲み会前も自然体でいられる", type: "N", value: 2 },
            B: { label: "話せるか少し不安になることが多い", type: "T", value: 2 },
            C: { label: "どちらでもない", type: "T", value: 1 }
        }
    },
    6: {
        question: "飲み会のスタイルは...",
        factor: "O/S",
        priority_factor: "O",
        options: {
            A: { label: "雰囲気が毎回違う方が好き", type: "O", value: 2 },
            B: { label: "いつも通りの流れが落ち着く", type: "S", value: 2 },
            C: { label: "どちらでもない", type: "S", value: 1 }
        }
    },
    7: {
        question: "帰る時間は...",
        factor: "C/R",
        priority_factor: "C",
        options: {
            A: { label: "決めた時間に帰る方だ", type: "C", value: 2 },
            B: { label: "楽しくて予定より長くなることが多い", type: "R", value: 2 },
            C: { label: "どちらでもない", type: "R", value: 1 }
        }
    },
    8: {
        question: "お店選びのときは...",
        factor: "A/H",
        priority_factor: "H",
        options: {
            A: { label: "みんなの希望を優先したい", type: "A", value: 2 },
            B: { label: "行きたい店にはこだわりがある", type: "H", value: 2 },
            C: { label: "どちらでもない", type: "A", value: 1 }
        }
    },
    9: {
        question: "飲み会の人数は...",
        factor: "E/I",
        priority_factor: "I",
        options: {
            A: { label: "大勢で飲むとテンションが上がる", type: "E", value: 2 },
            B: { label: "少人数や一人飲みが落ち着く", type: "I", value: 2 },
            C: { label: "どちらでもない", type: "I", value: 1 }
        }
    },
    10: {
        question: "飲み会の価値観として…",
        factor: "A/H",
        priority_factor: "H",
        options: {
            A: { label: "みんなが楽しめているか気にする", type: "A", value: 2 },
            B: { label: "自分もしっかり楽しめることが大切", type: "H", value: 2 },
            C: { label: "どちらでもない", type: "A", value: 1 }
        }
    },
    11: {
        question: "自分の発言で微妙な空気になったときは...",
        factor: "N/T",
        priority_factor: "N",
        options: {
            A: { label: "あまり気にせず流せる", type: "N", value: 2 },
            B: { label: "あとで気になってしまう", type: "T", value: 2 },
            C: { label: "どちらでもない", type: "T", value: 1 }
        }
    },
    12: {
        question: "飲み会の準備は...",
        factor: "C/R",
        priority_factor: "C",
        options: {
            A: { label: "事前に店を予約・確認しておきたい", type: "C", value: 2 },
            B: { label: "店は当日の気分で決めることが多い", type: "R", value: 2 },
            C: { label: "どちらでもない", type: "R", value: 1 }
        }
    },
    13: {
        question: "一緒に飲む人は...",
        factor: "O/S",
        priority_factor: "O",
        options: {
            A: { label: "普段関わらない人とも飲むのが楽しい", type: "O", value: 2 },
            B: { label: "お決まりのメンバーが心地いい", type: "S", value: 2 },
            C: { label: "どちらでもない", type: "S", value: 1 }
        }
    },
    14: {
        question: "お酒の飲む量は...",
        factor: "C/R",
        priority_factor: "C",
        options: {
            A: { label: "自分でコントロールできる", type: "C", value: 2 },
            B: { label: "つい飲みすぎてしまう", type: "R", value: 2 },
            C: { label: "どちらでもない", type: "R", value: 1 }
        }
    },
    15: {
        question: "初対面の人と飲むときは...",
        factor: "E/I",
        priority_factor: "I",
        options: {
            A: { label: "自分から話しかけることが多い", type: "E", value: 2 },
            B: { label: "自分から話しかけることはあまりない", type: "I", value: 2 },
            C: { label: "どちらでもない", type: "I", value: 1 }
        }
    }
};

// メモ化されたオプションコンポーネント
const Option = memo(({ 
  questionKey, 
  optionKey, 
  option, 
  isSelected, 
  onSelect 
}: { 
  questionKey: string; 
  optionKey: OptionKey; 
  option: { label: string; type: string; value: number }; 
  isSelected: boolean; 
  onSelect: (questionKey: string, optionKey: OptionKey) => void;
}) => {
  return (
    <div 
      className={`p-3 rounded-lg cursor-pointer transition-all ${isSelected ? 'neon-bg' : 'border-gray-300 hover:border-purple-300'}`}
      onClick={() => onSelect(questionKey, optionKey)}
    >
      <input 
        className="hidden" 
        type="radio" 
        id={`key-${questionKey}-${optionKey}`} 
        name={questionKey} 
        value={option.value}
        checked={isSelected}
        onChange={() => {}} // React requires onChange with checked prop
      />
      <label 
        htmlFor={`key-${questionKey}-${optionKey}`} 
        className="flex items-center cursor-pointer w-full"
      >
        <span className={`w-5 h-5 rounded-full mr-3 border flex items-center justify-center ${isSelected ? 'bg-white' : 'border-gray-400'}`}>
          {isSelected && <span className="text-black text-xs">✓</span>}
        </span>
        {option.label}
      </label>
    </div>
  );
});

Option.displayName = 'Option';

// メモ化された質問コンポーネント
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
  onOptionSelect: (questionKey: string, optionKey: OptionKey) => void;
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
      <p className="text-l font-bold mb-3">{question.question}</p>
      <div className="flex flex-col gap-2 w-full" onClick={e => e.stopPropagation()}>
        {(Object.keys(question.options) as OptionKey[]).map((optionKey) => (
          <Option
            key={`${questionKey}-${optionKey}`}
            questionKey={questionKey}
            optionKey={optionKey}
            option={question.options[optionKey]}
            isSelected={selectedOption === optionKey}
            onSelect={onOptionSelect}
          />
        ))}
      </div>
    </div>
  );
});

QuestionItem.displayName = 'QuestionItem';

export default function DrinkingCharacter() {
  const router = useRouter();
  const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 質問要素への参照を保持
  const questionRefs = useRef<(HTMLDivElement | null)[]>([]);
  
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
  const handleOptionChange = useCallback((questionKey: string, optionKey: OptionKey) => {
    setSelectedOptions(prev => ({
      ...prev,
      [questionKey]: optionKey
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
      // 回答データの整形
      const answersData = Object.entries(selectedOptions).reduce((acc, [key, option]) => {
        const questionNumber = parseInt(key);
        const questionData = questions[questionNumber];
        
        if (questionData && (option as OptionKey)) {
          const optionKey = option as OptionKey;
          acc[questionNumber] = {
            question: questionData.question,
            answer: option,
            factor: questionData.factor,
            type: questionData.options[optionKey]?.type || '',
            value: questionData.options[optionKey]?.value || 0
          };
        }
        return acc;
      }, {} as Record<string, any>);

      // Firestoreに保存
      const docRef = await addDoc(collection(db, "character_responses"), {
        userId: auth.currentUser.uid,
        answers: answersData,
        timestamp: new Date(),
        status: 'pending' // 処理状態を追加
      });

      // APIを呼び出して処理を開始
      const response = await fetch('/api/process-character', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          responseId: docRef.id,
          userId: auth.currentUser.uid
        })
      });

      if (!response.ok) {
        throw new Error('処理リクエストに失敗しました');
      }

      // 確認ページへリダイレクト
      router.push(`/register/character_confirmation?id=${docRef.id}`);

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
        お酒の飲み方診断
      </h1>
      
      <div className="w-full max-w-md space-y-8 mt-4">
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
