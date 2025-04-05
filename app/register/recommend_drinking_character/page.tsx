'use client'

import { useRouter } from 'next/navigation'
import { Wine, Beer, ArrowRight, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function RecommendDrinkingCharacter() {
  const router = useRouter()

  return (
    <div className="flex flex-col items-center justify-start min-h-screen py-8 px-4">
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
          onClick={() => router.push('/register/drinking_type')}
          className="relative overflow-hidden bg-black/30 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6 cursor-pointer hover:bg-black/40 transition-all group"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-pink-500/20">
              <Wine className="w-6 h-6 text-pink-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2 text-white group-hover:text-pink-400 transition-colors">
                飲みタイプ診断
              </h3>
              <p className="text-gray-300 mb-4">
                あなたの飲み会での振る舞いや好みを分析し、最適な飲み仲間をマッチングします。
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Clock className="w-4 h-4" />
                <span>所要時間: 約5分</span>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-pink-400 transition-colors" />
          </div>
        </div>

        {/* 酒癖フィルター診断カード */}
        <div 
          onClick={() => router.push('/register/drinking_habit')}
          className="relative overflow-hidden bg-black/30 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6 cursor-pointer hover:bg-black/40 transition-all group"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-purple-500/20">
              <Beer className="w-6 h-6 text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2 text-white group-hover:text-purple-400 transition-colors">
                酒癖フィルター診断
              </h3>
              <p className="text-gray-300 mb-4">
                お酒を飲んだときの特徴や傾向を分析し、相性の良い飲み仲間を見つけます。
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Clock className="w-4 h-4" />
                <span>所要時間: 約3分</span>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-400 transition-colors" />
          </div>
        </div>

        {/* スキップボタン */}
        <div className="mt-8 text-center">
          <Button
            variant="ghost"
            onClick={() => router.push('/register/upload-profile-images')}
            className="text-gray-400 hover:text-white"
          >
            診断をスキップ
          </Button>
        </div>
      </div>
    </div>
  )
}