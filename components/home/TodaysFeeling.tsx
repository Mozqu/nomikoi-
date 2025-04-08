"use client"

import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, Wine } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { addDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore'
import { db } from "@/app/firebase/config"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/hooks/useAuth"

interface DrinkingMood {
  createdAt: Date
  startTimeZone: string
  startTime: string
  timeStance: string
  area: string[]
  companions: {
    male: number
    female: number
  }
  costStance: string
  mealPreference: string
  atmosphere: string[]
  cuisineTypes: string[]
  drinkTypes: string[]
  customNotes: string
  uid: string
}

const TodaysFeeling = () => {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const touchStartY = useRef<number>(0)
  const touchMoveY = useRef<number>(0)
  const [formData, setFormData] = useState({
    startTimeZone: "",
    startTime: "",
    timeStance: "",
    area: [] as string[],
    companions: { male: 0, female: 0 },
    costStance: "",
    mealPreference: "",
    atmosphere: [] as string[],
    cuisineTypes: [] as string[],
    drinkTypes: [] as string[],
    customNotes: ""
  })

  // ユーザー認証の状態を取得
  const { user } = useAuth()  // Firebaseの認証フックを追加

  // 既存データの取得
  useEffect(() => {
    const fetchTodaysMood = async () => {
      try {
        // ユーザーがログインしていない場合は早期リターン
        if (!user) {
          toast({
            variant: "destructive",
            title: "エラー",
            description: "ログインが必要です。",
          })
          return
        }

        const q = query(
          collection(db, 'drinkingMoods'), 
          where('uid', '==', user.uid),  // ユーザーIDでフィルタリング
          where('createdAt', '>=', new Date(new Date().setHours(0, 0, 0, 0)))
        )
        const querySnapshot = await getDocs(q)
        
        if (!querySnapshot.empty) {
          const todaysMood = querySnapshot.docs[0].data()
          setFormData({
            startTimeZone: todaysMood.startTimeZone || "",
            startTime: todaysMood.startTime || "",
            timeStance: todaysMood.timeStance || "",
            area: todaysMood.area || [],
            companions: todaysMood.companions || { male: 0, female: 0 },
            costStance: todaysMood.costStance || "",
            mealPreference: todaysMood.mealPreference || "",
            atmosphere: todaysMood.atmosphere || [],
            cuisineTypes: todaysMood.cuisineTypes || [],
            drinkTypes: todaysMood.drinkTypes || [],
            customNotes: todaysMood.customNotes || ""
          })
        }
      } catch (error) {
        console.error('Error fetching today\'s mood:', error)
        toast({
          variant: "destructive",
          title: "エラー",
          description: "データの取得中にエラーが発生しました。",
        })
      }
    }

    fetchTodaysMood()
  }, [toast, user]) // toastとuserを依存配列に追加

  useEffect(() => {
    const instantMenu = document.querySelector('#instant-menu')
    if (!instantMenu) return

    const handleTouchStart = (e: Event) => {
      const touchEvent = e as TouchEvent
      touchStartY.current = touchEvent.touches[0].clientY
    }

    const handleTouchMove = (e: Event) => {
      e.preventDefault() // スクロールを防止
      const touchEvent = e as TouchEvent
      touchMoveY.current = touchEvent.touches[0].clientY
      const diff = touchStartY.current - touchMoveY.current

      console.log('移動距離:', diff, 'px')
      console.log('開始位置:', touchStartY.current, '現在位置:', touchMoveY.current)

      // 上スワイプで50px以上の移動があれば表示
      if (diff > 50) {
        console.log('上スワイプ')
        setIsExpanded(true)
      } else if (diff < -50) {
        console.log('下スワイプ')
        setIsOpen(false)
        setIsExpanded(false)
      }
    }

    const handleTouchEnd = (e: Event) => {
      // タッチ終了時に値をリセット
      touchStartY.current = 0
      touchMoveY.current = 0
    }

    instantMenu.addEventListener('touchstart', handleTouchStart, { passive: false })
    instantMenu.addEventListener('touchmove', handleTouchMove, { passive: false })
    instantMenu.addEventListener('touchend', handleTouchEnd)

    return () => {
      instantMenu.removeEventListener('touchstart', handleTouchStart)
      instantMenu.removeEventListener('touchmove', handleTouchMove)
      instantMenu.removeEventListener('touchend', handleTouchEnd)
    }
  }, [])

  useEffect(() => {
    if (formData.startTimeZone === "daytime") {
      setFormData({...formData, startTime: "9:00"})
    } else if (formData.startTimeZone === "evening") {
      setFormData({...formData, startTime: "17:00"})
    } else if (formData.startTimeZone === "night") {
      setFormData({...formData, startTime: "21:00"})
    } else if (formData.startTimeZone === "morning") {
      setFormData({...formData, startTime: "5:00"})
    }
  }, [formData.startTimeZone])

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  const handleSaveMood = async () => {
    try {
      if (!user) {
        toast({
          variant: "destructive",
          title: "エラー",
          description: "ログインが必要です。",
        })
        return
      }

      const q = query(
        collection(db, 'drinkingMoods'), 
        where('uid', '==', user.uid),  // ユーザーIDでフィルタリング
        where('createdAt', '>=', new Date(new Date().setHours(0, 0, 0, 0)))
      )
      
      // 既存のドキュメントを検索して削除
      const querySnapshot = await getDocs(q)
      
      // 本日分のドキュメントを削除
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref))
      await Promise.all(deletePromises)

      // 新しいドキュメントを作成
      const drinkingMoodData: DrinkingMood = {
        createdAt: new Date(),
        uid: user.uid,  // ユーザーIDを追加
        ...formData
      }

      await addDoc(collection(db, 'drinkingMoods'), drinkingMoodData)

      toast({
        title: "保存完了",
        description: "飲み気分を更新しました！",
      })
      // メニューを閉じる
      setIsOpen(false)
      setIsExpanded(false)

    } catch (error) {
      console.error('Error saving drinking mood:', error)
      toast({
        variant: "destructive",
        title: "エラー",
        description: "保存中にエラーが発生しました。もう一度お試しください。",
      })
    }
  }

  // 駅名検索の状態管理を追加
  const [searchQuery, setSearchQuery] = useState("")
  const [stations, setStations] = useState<Array<{name: string, prefecture: string, line: string}>>([])
  const [isSearching, setIsSearching] = useState(false)

  // 駅名検索関数
  const searchStations = async (query: string) => {
    if (query.length < 2) return // 2文字以上で検索開始

    setIsSearching(true)
    try {
      const response = await fetch(
        `https://express.heartrails.com/api/json?method=getStations&name=${encodeURIComponent(query)}`
      )
      const data = await response.json()
      setStations(data.response.station || [])
    } catch (error) {
      console.error('駅名検索エラー:', error)
      toast({
        variant: "destructive",
        title: "エラー",
        description: "駅名の検索中にエラーが発生しました。",
      })
    } finally {
      setIsSearching(false)
    }
  }

  // 駅名選択時の処理を修正
  const handleStationSelect = (stationName: string) => {
    if (!formData.area.includes(stationName)) {
      setFormData({
        ...formData, 
        area: [...formData.area, stationName]
      })
      setSearchQuery("") // 入力フィールドをクリア
      setStations([]) // 検索結果をクリア
    }
  }

  return (
    <div className="relative">

      {/* オーバーレイ（メニューが開いているときに背景をタップして閉じれるように） */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20"
          onClick={() => {
            setIsOpen(false)
            setIsExpanded(false)
          }}
        />
      )}

      {/* メインボタン */}
      <Button
        onClick={toggleMenu}
        className="absolute top-[-7rem] left-0 right-0 mx-auto w-[80%] neon-bg backdrop-blur-sm text-white rounded-full flex items-center gap-2"
      >
        <Wine className="h-5 w-5" />
        本日の飲み気分
      </Button>

      {/* スライドアップメニュー */}
      <div
        className={`
          fixed bottom-0 left-0 right-0 
          bg-gray-800/95 backdrop-blur-sm rounded-t-3xl 
          cursor-grab active:cursor-grabbing 
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-y-0' : 'translate-y-full'}
        `}
      >


        <div id="instant-menu" className="px-4 pb-4 text-white space-y-4">

            {/* インジケーターバー */}
            <div className="w-full flex justify-center pt-2 pb-4">
                <div className="w-12 h-1 bg-gray-400 rounded-full" />
            </div>

            <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                    <Wine className="h-5 w-5" />
                    <h3 className="text-lg">本日の飲み気分</h3>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400"  
                    onClick={() => {
                        if (isExpanded) {
                            setIsExpanded(false)
                        } else {
                            setIsExpanded(true)
                        }
                    }}
                >
                    <span>詳細を編集する</span>
                    {!isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                    ) : (
                        <ChevronDown className="h-4 w-4" />
                    )}
                </div>
            </div>
            <RadioGroup 
                value={formData.startTimeZone}
                onValueChange={(value) => setFormData({...formData, startTimeZone: value})}
                className="grid grid-cols-2 gap-4"
            >
                {[
                    { icon: "☀️", label: "日中から", value: "daytime" },
                    { icon: "🌙", label: "夕方から", value: "evening" },
                    { icon: "🌃", label: "深夜から", value: "night" },
                    { icon: "🌅", label: "早朝から", value: "morning" }
                ].map((item) => (
                    <div key={item.value} className="flex items-center">
                        <RadioGroupItem 
                            value={item.value} 
                            id={item.value}
                            className="hidden"
                        />
                        <Label 
                            htmlFor={item.value}
                            className={`
                                w-full flex items-center gap-2 rounded-xl p-4
                                transition-all duration-200
                                ${formData.startTimeZone === item.value 
                                    ? 'bg-pink text-white' 
                                    : 'bg-gray-700 text-gray-300'}
                            `}
                        >
                            <span>{item.icon}</span> {item.label}
                        </Label>
                    </div>
                ))}
            </RadioGroup>

            <Button className="w-full neon-bg" onClick={handleSaveMood}>
                飲み気分を保存
            </Button>
        </div>

        <div 
            id="detail-menu" 
            className={`
                overflow-hidden transition-all duration-300 ease-in-out
                ${isExpanded ? 'max-h-[calc(100svh-20rem)] opacity-100' : 'max-h-0 opacity-0'}
            `}
        >
            <div className="px-4 pb-20 space-y-6 overflow-y-auto" style={{ maxHeight: 'calc(100svh - 20rem)' }}>
                {/* 開始時間 */}
                <div className="space-y-2">
                    <Label>開始時間</Label>
                    <Select 
                        value={formData.startTime}
                        onValueChange={(value) => setFormData({...formData, startTime: value})}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="時間を選択" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                            {Array.from({length: 24}, (_, i) => (
                                <SelectItem 
                                    key={i} 
                                    value={`${i}:00`}
                                    className="text-white hover:bg-gray-700 focus:bg-gray-700"
                                >
                                    {i}:00
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* 時間スタンス */}
                <div className="space-y-2">
                    <Label>時間スタンス</Label>
                    <RadioGroup 
                        value={formData.timeStance}
                        onValueChange={(value) => setFormData({...formData, timeStance: value})}
                    >
                        <div className="flex flex-wrap gap-2">
                            {["サクッと", "1軒だけ", "2,3軒くらい", "終電まで"].map((item) => (
                                <div key={item} className="flex items-center space-x-2">
                                    <RadioGroupItem 
                                        value={item} 
                                        id={item} 
                                        className="hidden"
                                    />
                                    <Label 
                                        htmlFor={item}
                                        className={`
                                            text-white px-3 py-2 rounded-full
                                            ${formData.timeStance === item 
                                                ? 'border border-pink-500 text-white'     
                                                : 'border border-gray-300 text-gray-300'}
                                        `}
                                    >
                                        {item}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </RadioGroup>
                </div>

                {/* 同伴の有無 */}
                <div className="space-y-2">
                    <Label>同伴人数</Label>
                    <div className="flex gap-4">
                        <div className="space-y-1">
                            <Label>男性</Label>
                            <Input 
                                type="number" 
                                min="0"
                                value={formData.companions.male}
                                onChange={(e) => setFormData({
                                    ...formData, 
                                    companions: {...formData.companions, male: parseInt(e.target.value) || 0}
                                })}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>女性</Label>
                            <Input 
                                type="number"
                                min="0"
                                value={formData.companions.female}
                                onChange={(e) => setFormData({
                                    ...formData, 
                                    companions: {...formData.companions, female: parseInt(e.target.value) || 0}
                                })}
                            />
                        </div>
                    </div>
                </div>

                {/* 雰囲気（複数選択） */}
                <div className="space-y-2">
                    <Label>雰囲気（複数選択可）</Label>
                    <div className="flex flex-wrap gap-2">
                        {[
                            "しっぽり", "わいわい", "カジュアルに", "おしゃれに",
                            "パーっと", "飲み歩き", "食事にこだわりたい", "お酒にこだわりたい",
                            "立ち飲み系", "居酒屋系", "レストラン系", "バー系",
                            "歌いたい", "クラブ系", "アミューズメント系", "オンライン呑み"
                        ].map((item) => (
                            <div key={item} className="flex items-center">
                                <Checkbox 
                                    id={item}
                                    checked={formData.atmosphere.includes(item)}
                                    onCheckedChange={(checked) => {
                                        if (checked) {
                                            setFormData({
                                                ...formData,
                                                atmosphere: [...formData.atmosphere, item]
                                            })
                                        } else {
                                            setFormData({
                                                ...formData,
                                                atmosphere: formData.atmosphere.filter(i => i !== item)
                                            })
                                        }
                                    }}
                                    className="hidden"
                                />
                                <Label 
                                    className={`
                                        rounded-full px-3 py-2 transition-all duration-200
                                        ${formData.atmosphere.includes(item) 
                                            ? 'border border-pink-500 text-white' 
                                            : 'border border-gray-300 text-gray-300'}
                                    `}
                                    htmlFor={item}
                                >
                                    {item}
                                </Label>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 希望エリア */}
                <div className="space-y-2">
                    <Label>希望エリア（駅名）</Label>
                    <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                            <Input 
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value)
                                    searchStations(e.target.value)
                                }}
                                placeholder="駅名を入力"
                            />
                        </div>
                        
                        {/* 検索結果の表示 */}
                        {isSearching && <div className="text-sm text-gray-400">検索中...</div>}
                        
                        {stations.length > 0 && (
                            <div className="bg-gray-800 rounded-md p-2 max-h-40 overflow-y-auto">
                                {stations.map((station, index) => (
                                    <div
                                        key={`${station.name}-${index}`}
                                        className="px-3 py-2 hover:bg-gray-700 cursor-pointer rounded-sm"
                                        onClick={() => handleStationSelect(station.name)}
                                    >
                                        {station.name}
                                        <span className="text-sm text-gray-400 ml-2">
                                            {station.prefecture} - {station.line}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* 選択された駅名の表示 */}
                        {formData.area.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {formData.area.map((stationName) => (
                                    <div 
                                        key={stationName}
                                        className="flex items-center gap-1 bg-pink-500 text-white px-3 py-1 rounded-full text-sm"
                                    >
                                        {stationName}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setFormData({
                                                    ...formData,
                                                    area: formData.area.filter(name => name !== stationName)
                                                })
                                            }}
                                            className="ml-2 hover:text-gray-200"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* 費用スタンス */}
                <div className="space-y-2">
                    <Label>費用スタンス</Label>
                    <RadioGroup 
                        value={formData.costStance}
                        onValueChange={(value) => setFormData({...formData, costStance: value})}
                    >
                        <div className="flex flex-wrap gap-2">
                            {[
                                "ご馳走する",
                                "ご馳走してほしい",
                                "気分次第",
                                "割り勘",
                                "明朗会計"
                            ].map((item) => (
                                <div key={item} className="flex items-center">
                                    <RadioGroupItem 
                                        value={item} 
                                        id={`cost-${item}`}
                                        className="hidden"
                                    />
                                    <Label 
                                        htmlFor={`cost-${item}`}
                                        className={`
                                            text-white px-3 py-2 rounded-full
                                            ${formData.costStance === item 
                                                ? 'border border-pink-500 text-white'     
                                                : 'border border-gray-300 text-gray-300'}
                                        `}
                                    >
                                        {item}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </RadioGroup>
                </div>

                {/* 食事の有無 */}
                <div className="space-y-2">
                    <Label>食事の有無</Label>
                    <RadioGroup 
                        value={formData.mealPreference}
                        onValueChange={(value) => setFormData({...formData, mealPreference: value})}
                    >
                        <div className="flex flex-wrap gap-2">
                            {[
                                "必要なし",
                                "食事希望",
                                "おつまみのみ"
                            ].map((item) => (
                                <div key={item} className="flex items-center">
                                    <RadioGroupItem 
                                        value={item} 
                                        id={`meal-${item}`}
                                        className="hidden"
                                    />
                                    <Label 
                                        htmlFor={`meal-${item}`}
                                        className={`
                                            text-white px-3 py-2 rounded-full
                                            ${formData.mealPreference === item 
                                                ? 'border border-pink-500 text-white'     
                                                : 'border border-gray-300 text-gray-300'}
                                        `}
                                    >
                                        {item}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </RadioGroup>
                </div>

                {/* 料理ジャンル */}
                <div className="space-y-2">
                    <Label>料理ジャンル（複数選択可）</Label>
                    <div className="flex flex-wrap gap-2">
                        {[
                            "焼き鳥・手羽先", "海鮮・寿司", "焼肉", "鍋", "中華",
                            "韓国料理", "アメリカン", "イタリアン", "エスニック",
                            "ビストロ・バル", "メキシカン", "シュラスコ"
                        ].map((item) => (
                            <div key={item} className="flex items-center">
                                <Checkbox 
                                    id={`cuisine-${item}`}
                                    checked={formData.cuisineTypes.includes(item)}
                                    onCheckedChange={(checked) => {
                                        if (checked) {
                                            setFormData({
                                                ...formData,
                                                cuisineTypes: [...formData.cuisineTypes, item]
                                            })
                                        } else {
                                            setFormData({
                                                ...formData,
                                                cuisineTypes: formData.cuisineTypes.filter(i => i !== item)
                                            })
                                        }
                                    }}
                                    className="hidden"
                                />
                                <Label 
                                    htmlFor={`cuisine-${item}`}
                                    className={`
                                        rounded-full px-3 py-2 transition-all duration-200
                                        ${formData.cuisineTypes.includes(item) 
                                            ? 'border border-pink-500 text-white' 
                                            : 'border border-gray-300 text-gray-300'}
                                    `}
                                >
                                    {item}
                                </Label>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ドリンク */}
                <div className="space-y-2">
                    <Label>ドリンク（複数選択可）</Label>
                    <div className="flex flex-wrap gap-2">
                        {[
                            "ビール", "クラフトビール", "ワイン", "日本酒", "焼酎",
                            "ホッピー", "ウイスキー", "ハイボール", "ブランデー",
                            "ラム", "酎ハイ・サワー", "カクテル", "パーティードリンク",
                            "紹興酒", "マッコリ"
                        ].map((item) => (
                            <div key={item} className="flex items-center">
                                <Checkbox 
                                    id={`drink-${item}`}
                                    checked={formData.drinkTypes.includes(item)}
                                    onCheckedChange={(checked) => {
                                        if (checked) {
                                            setFormData({
                                                ...formData,
                                                drinkTypes: [...formData.drinkTypes, item]
                                            })
                                        } else {
                                            setFormData({
                                                ...formData,
                                                drinkTypes: formData.drinkTypes.filter(i => i !== item)
                                            })
                                        }
                                    }}
                                    className="hidden"
                                />
                                <Label 
                                    htmlFor={`drink-${item}`}
                                    className={`
                                        rounded-full px-3 py-2 transition-all duration-200
                                        ${formData.drinkTypes.includes(item) 
                                            ? 'border border-pink-500 text-white' 
                                            : 'border border-gray-300 text-gray-300'}
                                    `}
                                >
                                    {item}
                                </Label>
                            </div>
                        ))}
                    </div>
                    <Input 
                        type="text"
                        placeholder="その他のドリンク"
                        value={formData.customNotes}
                        onChange={(e) => setFormData({...formData, customNotes: e.target.value})}
                    />
                </div>
            </div>
        </div>

      </div>

    </div>
  )
}

export default TodaysFeeling
