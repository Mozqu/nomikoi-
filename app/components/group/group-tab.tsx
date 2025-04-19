"use client"

import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { auth, db } from "@/app/firebase/config"
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs, startAfter, QueryDocumentSnapshot, writeBatch, where, doc, getDoc } from "firebase/firestore"
import { useToast } from "@/components/ui/use-toast"
import { Select } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { LoadingSpinner } from "@/app/components/ui/loading-spinner"
import GroupList from "@/app/components/home/groups/groupList"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

const drinkingTags = {
  "お酒の好み・こだわり": [
    "#赤ワイン", "#純米大吟醸", "#ラフロイグ", "#量より質",
    "#ホッピーは3で割る", "#いいちこサイダー", "#ショットNG",
    "#ずっと生", "#ワインはフルボディ", "#フルーティ日本酒"
  ],
  "飲みの生活スタイル": [
    "#昼飲み", "#風呂上りの缶ビール", "#飲まないけど飲みの場は好き",
    "#晩酌は日課", "#週末だけ飲む主義", "#仕事終わりの一杯が至高",
    "#朝まで飲んだ翌日は絶対休む", "#旅行先の酒場でローカル飲み",
    "#料理しながら飲んじゃう", "#ジム帰りのビール背徳感すごい"
  ],
  "飲みキャラ・ノリ・酒癖・体質": [
    "#幹事多め", "#飲むと英語喋る", "#弱いけど人には飲ませたい",
    "#飲みゲームが好き", "#飲んだら長い", "#酔うと喋る",
    "#酔ったら歌いたい", "#脱衣と遺失物", "#赤くなるけど飲める",
    "#ウーロンハイは無限"
  ],
  "飲む場所・空間のこだわり": [
    "#家飲みも好き", "#キャンプでチル飲み", "#隠れ家バー",
    "#新幹線でビール", "#1駅歩くならコンビニ酒", "#テーマパーク飲み",
    "#ロックバー開拓中", "#喫煙可の居酒屋で飲みたい", "#個室でゆったり飲みたい"
  ],
  "お酒の探究・趣味性": [
    "#おすすめのペアリングを試したい", "#ビール工場巡り", "#ソムリエ勉強中",
    "#日本酒検定持ってます", "#ウイスキーマニア", "#発酵や醸造に興味あり",
    "#利き酒チャレンジしてみたい", "#マリアージュ探求", "#酒器こだわり",
    "#世界のビールを制覇したい"
  ]
}

const hobbyTags = {
  "アウトドア・スポーツ": [
    "#キャンプ", "#登山", "#サーフィン", "#ゴルフ", 
    "#テニス", "#ヨガ", "#ランニング", "#スキー",
    "#ボルダリング", "#トレッキング"
  ],
  "アート・クリエイティブ": [
    "#写真撮影", "#絵画", "#陶芸", "#DIY",
    "#デザイン", "#イラスト", "#手芸", "#音楽",
    "#カリグラフィー", "#フラワーアレンジメント"
  ],
  "カルチャー・学び": [
    "#読書", "#映画鑑賞", "#美術館巡り", "#語学",
    "#歴史", "#哲学", "#建築", "#茶道",
    "#華道", "#書道"
  ],
  "フード・クッキング": [
    "#料理", "#パン作り", "#お菓子作り", "#コーヒー",
    "#ワイン", "#日本酒", "#チーズ", "#スパイス料理",
    "#発酵食品作り", "#燻製作り"
  ],
  "テクノロジー・ガジェット": [
    "#プログラミング", "#ガジェット", "#VR", "#ドローン",
    "#3Dプリンター", "#スマートホーム", "#自作PC",
    "#電子工作", "#ロボット", "#AI"
  ]
}

// グループ作成フォームのバリデーションスキーマ
const groupFormSchema = z.object({
  description: z.string().min(1, "グループの説明を入力してください"),
  memberNum: z.number().min(2, "2人以上を指定してください").max(10, "10人以下を指定してください"),
  gender: z.enum(["男性", "女性"], {
    required_error: "性別を選択してください",
  }),
  preferences: z.object({
    drinkingTags: z.array(z.string()).optional(),
    hobbyTags: z.array(z.string()).optional(),
    groupTypeTag: z.array(z.string()).optional(),
    favoriteArea: z.array(z.string()).optional(),
    favoriteTime: z.array(z.string()).optional(),
    favoriteMood: z.array(z.string()).optional(),
  }),
})

type GroupFormValues = z.infer<typeof groupFormSchema>

// グループ型の定義
interface Group {
  id: string;
  createdBy: string;
  createdAt: any;
  updatedAt: any;
  description: string;
  memberNum: number;
  gender: "男性" | "女性";
  invitedBy: string[];
  preferences: {
    drinkingTags: string[];
    hobbyTags: string[];
    groupTypeTag: string[];
    favoriteArea: string[];
    favoriteTime: string[];
    favoriteMood: string[];
  }
}

export default function GroupTab() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const [selectedDrinkingTags, setSelectedDrinkingTags] = useState<string[]>([])
  const [selectedHobbyTags, setSelectedHobbyTags] = useState<string[]>([])
  const [customDrinkingTag, setCustomDrinkingTag] = useState("")
  const [customHobbyTag, setCustomHobbyTag] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [stations, setStations] = useState<Array<{name: string, prefecture: string, line: string}>>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedStations, setSelectedStations] = useState<string[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [userGender, setUserGender] = useState<"男性" | "女性" | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [hasExistingGroup, setHasExistingGroup] = useState(false)
  const [existingGroupId, setExistingGroupId] = useState<string | null>(null)

  // ユーザーの既存グループをチェック
  useEffect(() => {
    const checkExistingGroup = async () => {
      if (!auth?.currentUser || !db) return

      try {
        const groupsRef = collection(db, "groups")
        const q = query(groupsRef, where("createdBy", "==", auth.currentUser.uid))
        const existingGroups = await getDocs(q)
        setHasExistingGroup(!existingGroups.empty)
        if (!existingGroups.empty) {
          const groupDoc = existingGroups.docs[0]
          setExistingGroupId(groupDoc.id)
          // 既存のグループデータをフォームに設定
          const groupData = groupDoc.data()
          form.reset({
            description: groupData.description,
            memberNum: groupData.memberNum,
            gender: groupData.gender,
            preferences: {
              drinkingTags: groupData.preferences.drinkingTags || [],
              hobbyTags: groupData.preferences.hobbyTags || [],
              groupTypeTag: groupData.preferences.groupTypeTag || [],
              favoriteArea: groupData.preferences.favoriteArea || [],
              favoriteTime: groupData.preferences.favoriteTime || [],
              favoriteMood: groupData.preferences.favoriteMood || [],
            },
          })
          // タグの状態を更新
          setSelectedDrinkingTags(groupData.preferences.drinkingTags?.map((tag: string) => `#${tag}`) || [])
          setSelectedHobbyTags(groupData.preferences.hobbyTags?.map((tag: string) => `#${tag}`) || [])
          setSelectedStations(groupData.preferences.favoriteArea || [])
        }
      } catch (error) {
        console.error("既存グループの確認に失敗しました:", error)
      }
    }

    checkExistingGroup()
  }, [refreshTrigger])

  // ユーザーの性別を取得
  useEffect(() => {
    const fetchUserGender = async () => {
      if (!auth?.currentUser || !db) return

      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid))
        const userData = userDoc.data()
        if (userData?.gender) {
          setUserGender(userData.gender)
        }
      } catch (error) {
        console.error("ユーザー情報の取得に失敗しました:", error)
      }
    }

    fetchUserGender()
  }, [])

  const form = useForm<GroupFormValues>({
    resolver: zodResolver(groupFormSchema),
    defaultValues: {
      description: "",
      memberNum: 2,
      gender: userGender || "both",
      preferences: {
        drinkingTags: [],
        hobbyTags: [],
        groupTypeTag: [],
        favoriteArea: [],
        favoriteTime: [],
        favoriteMood: [],
      },
    },
  })

  const handleDrinkingTagSelect = (tag: string) => {
    setSelectedDrinkingTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag)
      }
      return [...prev, tag]
    })
    form.setValue("preferences.drinkingTags", selectedDrinkingTags.includes(tag) 
      ? selectedDrinkingTags.filter(t => t !== tag).map(t => t.replace(/^#/, ''))
      : [...selectedDrinkingTags, tag].map(t => t.replace(/^#/, ''))
    )
  }

  const handleHobbyTagSelect = (tag: string) => {
    setSelectedHobbyTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag)
      }
      return [...prev, tag]
    })
    form.setValue("preferences.hobbyTags", selectedHobbyTags.includes(tag)
      ? selectedHobbyTags.filter(t => t !== tag).map(t => t.replace(/^#/, ''))
      : [...selectedHobbyTags, tag].map(t => t.replace(/^#/, ''))
    )
  }

  const handleAddCustomDrinkingTag = () => {
    if (customDrinkingTag && !selectedDrinkingTags.includes("#" + customDrinkingTag)) {
      const newTag = "#" + customDrinkingTag.trim().replace(/^#/, "")
      setSelectedDrinkingTags(prev => [...prev, newTag])
      form.setValue("preferences.drinkingTags", [...selectedDrinkingTags, newTag].map(t => t.replace(/^#/, '')))
      setCustomDrinkingTag("")
    }
  }

  const handleAddCustomHobbyTag = () => {
    if (customHobbyTag && !selectedHobbyTags.includes("#" + customHobbyTag)) {
      const newTag = "#" + customHobbyTag.trim().replace(/^#/, "")
      setSelectedHobbyTags(prev => [...prev, newTag])
      form.setValue("preferences.hobbyTags", [...selectedHobbyTags, newTag].map(t => t.replace(/^#/, '')))
      setCustomHobbyTag("")
    }
  }

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

  // 駅名選択時の処理
  const handleStationSelect = (stationName: string) => {
    if (!selectedStations.includes(stationName)) {
      const newStations = [...selectedStations, stationName]
      setSelectedStations(newStations)
      form.setValue("preferences.favoriteArea", newStations)
      setSearchQuery("") // 入力フィールドをクリア
      setStations([]) // 検索結果をクリア
    }
  }

  // 駅名削除時の処理
  const handleStationRemove = (stationName: string) => {
    const newStations = selectedStations.filter(name => name !== stationName)
    setSelectedStations(newStations)
    form.setValue("preferences.favoriteArea", newStations)
  }

  // フォームリセット時の処理
  const handleFormReset = () => {
    form.reset()
    setSelectedDrinkingTags([])
    setSelectedHobbyTags([])
    setCustomDrinkingTag("")
    setCustomHobbyTag("")
    setSearchQuery("")
    setStations([])
    setSelectedStations([])
  }

  async function onSubmit(data: GroupFormValues) {
    try {
      setIsLoading(true)
      if (!auth || !auth.currentUser) {
        throw new Error("ユーザーが認証されていません")
      }

      if (!db) {
        throw new Error("データベースが初期化されていません")
      }

      const batch = writeBatch(db)
      const now = new Date()

      // #を除去したタグ名の配列を作成
      const normalizedDrinkingTags = data.preferences.drinkingTags?.map(tag => tag.replace(/^#/, '')) || []
      const normalizedHobbyTags = data.preferences.hobbyTags?.map(tag => tag.replace(/^#/, '')) || []

      let existingDrinkingTagNames = new Set<string>()
      let existingHobbyTagNames = new Set<string>()

      // タグが存在する場合のみクエリを実行
      if (normalizedDrinkingTags.length > 0) {
        const existingDrinkingTagsQuery = query(
          collection(db, "tags"),
          where("tagName", "in", normalizedDrinkingTags)
        )
        const existingDrinkingTagsSnapshot = await getDocs(existingDrinkingTagsQuery)
        existingDrinkingTagNames = new Set(
          existingDrinkingTagsSnapshot.docs.map(doc => doc.data().tagName)
        )
      }

      if (normalizedHobbyTags.length > 0) {
        const existingHobbyTagsQuery = query(
          collection(db, "tags"),
          where("tagName", "in", normalizedHobbyTags)
        )
        const existingHobbyTagsSnapshot = await getDocs(existingHobbyTagsQuery)
        existingHobbyTagNames = new Set(
          existingHobbyTagsSnapshot.docs.map(doc => doc.data().tagName)
        )
      }

      // 新規飲みタグを作成
      for (const tag of normalizedDrinkingTags) {
        if (!existingDrinkingTagNames.has(tag)) {
          const tagRef = doc(db, "tags", crypto.randomUUID())
          batch.set(tagRef, {
            tagName: tag,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
            isDrink: true
          })
        }
      }

      // 新規趣味タグを作成
      for (const tag of normalizedHobbyTags) {
        if (!existingHobbyTagNames.has(tag)) {
          const tagRef = doc(db, "tags", crypto.randomUUID())
          batch.set(tagRef, {
            tagName: tag,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
            isDrink: false
          })
        }
      }

      const groupData = {
        ...data,
        gender: userGender || "both",
        updatedAt: serverTimestamp(),
      } as const

      const groupsRef = collection(db, "groups")
      
      if (existingGroupId) {
        // 既存のグループを更新
        const groupRef = doc(groupsRef, existingGroupId)
        const existingGroupDoc = await getDoc(groupRef)
        const existingData = existingGroupDoc.data()
        
        // 既存のデータと新しいデータをマージ
        const updatedGroupData = {
          ...existingData,
          ...groupData,
          createdBy: existingData.createdBy,
          createdAt: existingData.createdAt,
          invitedBy: existingData.invitedBy || [],
        }
        
        batch.update(groupRef, updatedGroupData)
        await batch.commit()
        
        toast({
          title: "グループを更新しました",
          description: "グループ情報が更新されました。",
        })
      } else {
        // 新しいグループを作成
        const newGroupData = {
          ...groupData,
          createdBy: auth.currentUser.uid,
          createdAt: serverTimestamp(),
          invitedBy: [],
        }
        await batch.commit()
        await addDoc(groupsRef, newGroupData)
        toast({
          title: "グループを作成しました",
          description: "新しいグループが作成されました。",
        })
      }
      
      handleFormReset()
      setIsDialogOpen(false)
      setRefreshTrigger(prev => prev + 1)
    } catch (error) {
      console.error("グループの保存に失敗しました:", error)
      toast({
        variant: "destructive",
        title: "エラー",
        description: "グループの保存に失敗しました。",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // イベントリスナーを追加
  useEffect(() => {
    const handleOpenDialog = () => {
      setIsDialogOpen(true)
    }

    window.addEventListener('openGroupCreateDialog', handleOpenDialog)
    return () => {
      window.removeEventListener('openGroupCreateDialog', handleOpenDialog)
    }
  }, [])

  return (
    <div className="container w-full p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">グループマッチ</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="rounded-full">
              <Plus className="h-5 w-5 mr-2" />
              {hasExistingGroup ? "グループを編集" : "グループを作成"}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto bg-gray-900 border-none rounded-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=open]:slide-in-from-left-1/2 duration-200">
            <DialogHeader>
              <DialogTitle>{hasExistingGroup ? "グループを編集" : "グループを作成"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                {/* 募集人数 */}  
                <FormField
                  control={form.control}
                  name="memberNum"
                  render={({ field }) => (
                    <FormItem className="flex gap-2">
                      <FormLabel className="w-1/2 flex justify-center items-center"><span className="">募集人数</span></FormLabel>
                      <FormControl>
                        <Input
                          className="form-input"
                          type="number"
                          min={2}
                          max={10}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* favoriteArea */}
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>エリアを選択</FormLabel>
                      <FormControl>
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <Input 
                              className="form-input flex-1"
                              type="text"
                              value={searchQuery}
                              onChange={(e) => {
                                setSearchQuery(e.target.value)
                                searchStations(e.target.value)
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault() // フォームの送信を防ぐ
                                }
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
                          {selectedStations.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {selectedStations.map((stationName) => (
                                <div 
                                  key={stationName}
                                  className="flex items-center gap-1 bg-pink-500 text-white px-3 py-1 rounded-full text-sm"
                                >
                                  {stationName}
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault()
                                      handleStationRemove(stationName)
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
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* グループコメント */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>グループコメント</FormLabel>
                      <FormControl>
                        <Textarea
                          className="form-input"
                          placeholder="グループの説明を入力してください"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* favoriteMood */}
                <FormField
                  control={form.control}
                  name="preferences.favoriteMood"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>好みの雰囲気（複数選択可）</FormLabel>
                      <FormControl>
                        <div className="flex flex-wrap gap-2">
                          {[
                            "しっぽり", "わいわい", "カジュアルに", "おしゃれに",
                            "パーっと", "飲み歩き", "食事にこだわりたい", "お酒にこだわりたい",
                            "立ち飲み系", "居酒屋系", "レストラン系", "バー系",
                            "歌いたい", "クラブ系", "アミューズメント系", "オンライン呑み"
                          ].map((item) => (
                            <div key={item} className="flex items-center">
                              <Checkbox 
                                id={`mood-${item}`}
                                checked={field.value?.includes(item)}
                                onCheckedChange={(checked) => {
                                  const currentValue = field.value || []
                                  if (checked) {
                                    field.onChange([...currentValue, item])
                                  } else {
                                    field.onChange(currentValue.filter(i => i !== item))
                                  }
                                }}
                                className="hidden"
                              />
                              <Label 
                                htmlFor={`mood-${item}`}
                                className={`
                                  rounded-full px-3 py-2 transition-all duration-200
                                  ${field.value?.includes(item)
                                    ? 'border border-pink-500 text-white' 
                                    : 'border border-gray-300 text-gray-300'}
                                `}
                              >
                                {item}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* favoriteTime */}
                <FormField
                  control={form.control}
                  name="preferences.favoriteTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>好みの時間帯（複数選択可）</FormLabel>
                      <FormControl>
                        <div className="flex flex-wrap gap-2">
                          {[
                            "平日の昼OK",
                            "平日の夜OK",
                            "金/土/祝の前日OK",
                            "土/日/祝の昼OK",
                            "土/日/祝の夜OK",
                            "いつでも合わせられる"
                          ].map((item) => (
                            <div key={item} className="flex items-center">
                              <Checkbox 
                                id={`time-${item}`}
                                checked={field.value?.includes(item)}
                                onCheckedChange={(checked) => {
                                  const currentValue = field.value || []
                                  if (checked) {
                                    field.onChange([...currentValue, item])
                                  } else {
                                    field.onChange(currentValue.filter(i => i !== item))
                                  }
                                }}
                                className="hidden"
                              />
                              <Label 
                                htmlFor={`time-${item}`}
                                className={`
                                  rounded-full px-3 py-2 transition-all duration-200
                                  ${field.value?.includes(item)
                                    ? 'border border-pink-500 text-white' 
                                    : 'border border-gray-300 text-gray-300'}
                                `}
                              >
                                {item}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* ドリンクタグ */}
                <div className="space-y-2 ">
                  <h3 className="font-semibold">お酒に関するタグ</h3>
                  <div className="flex gap-2 mb-4 bg-black p-2 rounded-md">
                    <Input
                      type="text"
                      placeholder="カスタムタグを追加（#は不要）"
                      value={customDrinkingTag}
                      onChange={(e) => setCustomDrinkingTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddCustomDrinkingTag()
                        }
                      }}
                      className="form-input flex-1"
                    />
                    <Button
                      type="button"
                      onClick={handleAddCustomDrinkingTag}
                      disabled={!customDrinkingTag}
                      className="bg-pink-600 text-white px-3 py-1.5 rounded-md text-sm flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedDrinkingTags.map(tag => (
                      <div
                        key={tag}
                        className="bg-pink-600 text-white px-3 py-1.5 rounded-full text-sm flex items-center gap-1"
                      >
                        {tag}
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            handleDrinkingTagSelect(tag)
                          }}
                          className="hover:text-gray-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                </div>

                {/* 趣味タグ */}
                <div className="space-y-2">
                  <h3 className="font-semibold">趣味に関するタグ</h3>
                  <div className="flex gap-2 mb-4 bg-black p-2 rounded-md">
                    <Input
                      type="text"
                      placeholder="カスタムタグを追加（#は不要）"
                      value={customHobbyTag}
                      onChange={(e) => setCustomHobbyTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddCustomHobbyTag()
                        }
                      }}
                      className="form-input flex-1"
                    />
                    <Button
                      type="button"
                      onClick={handleAddCustomHobbyTag}
                      disabled={!customHobbyTag}
                      className="bg-pink-600 text-white px-3 py-1.5 rounded-md text-sm flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedHobbyTags.map(tag => (
                      <div
                        key={tag}
                        className="bg-purple-600 text-white px-3 py-1.5 rounded-full text-sm flex items-center gap-1"
                      >
                        {tag}
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            handleHobbyTagSelect(tag)
                          }}
                          className="hover:text-gray-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                </div>

                <Button className="w-full rounded-full neon-bg" type="submit" disabled={isLoading}>
                  {hasExistingGroup ? (isLoading ? "編集中..." : "グループを編集") : (isLoading ? "作成中..." : "グループを作成")}
                </Button>

              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      <GroupList refreshTrigger={refreshTrigger} />
    </div>
  )
} 