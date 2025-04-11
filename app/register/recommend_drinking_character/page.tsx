'use client'

import { useRouter } from 'next/navigation'
import { Wine, Beer, ArrowRight, Clock, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db, auth } from '@/app/firebase/config'

export default function RecommendDrinkingCharacter() {
  const router = useRouter()
  const [characterResults, setCharacterResults] = useState<any>(null)
  const [drinkingHabitResults, setDrinkingHabitResults] = useState<any>(null)

  useEffect(() => {
    const fetchResults = async () => {
      if (!auth?.currentUser || !db) return;
      
      try {
        // キャラクター診断結果の取得
        const resultsRef = collection(db, 'character_results');
        const q = query(resultsRef, where('userId', '==', auth.currentUser.uid));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          setCharacterResults(querySnapshot.docs[0].data());
        }

        // 飲み方診断結果の取得
        const userRef = collection(db, 'users');
        const userQuery = query(userRef, where('userId', '==', auth.currentUser.uid));
        const userSnapshot = await getDocs(userQuery);
        
        if (!userSnapshot.empty) {
          const userData = userSnapshot.docs[0].data();
          setDrinkingHabitResults(userData.answers?.drinking_habit);
        }
      } catch (error) {
        console.error('診断結果の取得に失敗:', error);
      }
    };

    fetchResults();
  }, []);

  return (
    <div className="flex flex-col items-center justify-start min-h-screen relative">
      <div className="w-full h-full overflow-y-auto pt-8 px-4">
        <h1 className="text-2xl font-bold mb-6 backdrop-blur-sm z-10 py-4 w-full text-center border-b border-gray-200">
          飲みタイプ・酒癖フィルター診断
        </h1>

        <div className="max-w-2xl w-full mx-auto mt-8 space-y-6">
          <p className="text-center text-gray-300 mb-8">
            より良いマッチングのために、2つの診断テストを用意しています。<br />
            お好みのテストを選んでください。
          </p>

          {/* 飲みタイプ診断カード */}
          <div 
            onClick={() => router.push('/register/drinking_character')}
            className={`relative bg-black/30 backdrop-blur-sm border ${characterResults ? 'border-green-500/30' : 'border-purple-500/30'} rounded-xl p-6 cursor-pointer hover:bg-black/40 transition-all group`}
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-full ${characterResults ? 'bg-green-500/20' : 'bg-pink-500/20'}`}>
                {characterResults ? (
                  <CheckCircle className="w-6 h-6 text-green-400" />
                ) : (
                  <Wine className="w-6 h-6 text-pink-400" />
                )}
              </div>
              <div className="flex-1">
                <h3 className={`text-xl font-bold mb-2 text-white group-hover:${characterResults ? 'text-green-400' : 'text-pink-400'} transition-colors`}>
                  飲みタイプ診断
                  {characterResults && <span className="ml-2 text-sm text-green-400">診断済み</span>}
                </h3>
                <p className="text-gray-300 mb-4">
                 「4つの感性」×「8つのキャラ」の32タイプの性格に分類し、性格相性でマッチング。
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>所要時間: 約1分</span>
                </div>
              </div>
              <ArrowRight className={`w-5 h-5 text-gray-400 group-hover:${characterResults ? 'text-green-400' : 'text-pink-400'} transition-colors`} />
            </div>
          </div>

          {/* 酒癖フィルター診断カード */}
          <div 
            onClick={() => router.push('/register/acceptable_drinking_habit')}
            className={`relative bg-black/30 backdrop-blur-sm border ${drinkingHabitResults ? 'border-green-500/30' : 'border-purple-500/30'} rounded-xl p-6 cursor-pointer hover:bg-black/40 transition-all group`}
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-full ${drinkingHabitResults ? 'bg-green-500/20' : 'bg-purple-500/20'}`}>
                {drinkingHabitResults ? (
                  <CheckCircle className="w-6 h-6 text-green-400" />
                ) : (
                  <Beer className="w-6 h-6 text-purple-400" />
                )}
              </div>
              <div className="flex-1">
                <h3 className={`text-xl font-bold mb-2 text-white group-hover:${drinkingHabitResults ? 'text-green-400' : 'text-purple-400'} transition-colors`}>
                  酒癖フィルター診断
                  {drinkingHabitResults && <span className="ml-2 text-sm text-green-400">診断済み</span>}
                </h3>
                <p className="text-gray-300 mb-4">
                  飲酒の行動とその許容度で相性をチェック。
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>所要時間: 約2分</span>
                </div>
              </div>
              <ArrowRight className={`w-5 h-5 text-gray-400 group-hover:${drinkingHabitResults ? 'text-green-400' : 'text-purple-400'} transition-colors`} />
            </div>
          </div>

          {/* スキップ/次へボタン */}
          <div className="mt-8 text-center">
            <Button
              variant="ghost"
              onClick={() => router.push('/register/upload-profile-images')}
              className={`hover:text-white w-full ${characterResults && drinkingHabitResults ? 'neon-bg text-white' : 'text-gray-400'}`}
            >
              {characterResults && drinkingHabitResults ? '次へ' : '診断をスキップ'}
            </Button>
          </div>

          <div className="h-36"></div>
        </div>
      </div>
    </div>
  )
}