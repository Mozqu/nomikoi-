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
  gender: z.enum(["male", "female", "both"], {
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
  gender: "male" | "female" | "both";
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
  const [userGender, setUserGender] = useState<"male" | "female" | null>(null)
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
        await batch.update(groupRef, groupData)
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
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>グループの説明</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="memberNum"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>メンバー数</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>性別</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex-row"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="male" id="gender-male" />
                            <Label htmlFor="gender-male">男性</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="female" id="gender-female" />
                            <Label htmlFor="gender-female">女性</Label>
                                </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="both" id="gender-both" />
                            <Label htmlFor="gender-both">両方</Label>
                            </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="preferences.drinkingTags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>お酒の好み・こだわり</FormLabel>
                      <FormControl>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value?.[0] || "選択してください"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command>
                              <CommandInput placeholder="検索..." />
                              <CommandEmpty>見つかりません</CommandEmpty>
                              <CommandGroup>
                                {drinkingTags["お酒の好み・こだわり"].map((tag) => (
                                  <CommandItem
                                    key={tag}
                                    value={tag}
                                    onSelect={() => field.onChange([tag])}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value?.[0] === tag ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {tag}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="preferences.hobbyTags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>アウトドア・スポーツ</FormLabel>
                      <FormControl>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value?.[0] || "選択してください"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command>
                              <CommandInput placeholder="検索..." />
                              <CommandEmpty>見つかりません</CommandEmpty>
                              <CommandGroup>
                                {hobbyTags["アウトドア・スポーツ"].map((tag) => (
                                  <CommandItem
                                    key={tag}
                                    value={tag}
                                    onSelect={() => field.onChange([tag])}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value?.[0] === tag ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {tag}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="preferences.groupTypeTag"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>飲みの生活スタイル</FormLabel>
                      <FormControl>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value?.[0] || "選択してください"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command>
                              <CommandInput placeholder="検索..." />
                              <CommandEmpty>見つかりません</CommandEmpty>
                              <CommandGroup>
                                {Object.keys(drinkingTags).map((key) => (
                                  <CommandItem
                                    key={key}
                                    value={key}
                                    onSelect={() => field.onChange([key])}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value?.[0] === key ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {key}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="preferences.favoriteArea"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>飲む場所・空間のこだわり</FormLabel>
                      <FormControl>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value?.[0] || "選択してください"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command>
                              <CommandInput 
                                placeholder="駅名を検索..." 
                                value={searchQuery}
                                onValueChange={setSearchQuery}
                              />
                              <CommandEmpty>見つかりません</CommandEmpty>
                              <CommandGroup>
                                {stations.map((station) => (
                                  <CommandItem
                                    key={station.name}
                                    value={station.name}
                                    onSelect={() => {
                                      field.onChange([station.name])
                                      handleStationSelect(station.name)
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value?.[0] === station.name ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {station.name}
                                    <span className="ml-2 text-sm text-gray-500">
                                      {station.prefecture} - {station.line}
                                    </span>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="preferences.favoriteTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>飲む時間</FormLabel>
                      <FormControl>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value?.[0] || "選択してください"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command>
                              <CommandInput placeholder="検索..." />
                              <CommandEmpty>見つかりません</CommandEmpty>
                              <CommandGroup>
                          {[
                            "平日の昼OK",
                            "平日の夜OK",
                            "金/土/祝の前日OK",
                            "土/日/祝の昼OK",
                            "土/日/祝の夜OK",
                            "いつでも合わせられる"
                                ].map((time) => (
                                  <CommandItem
                                    key={time}
                                    value={time}
                                    onSelect={() => field.onChange([time])}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value?.[0] === time ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {time}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="preferences.favoriteMood"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>飲む気分</FormLabel>
                      <FormControl>
                        <Popover>
                          <PopoverTrigger asChild>
                    <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value?.[0] || "選択してください"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command>
                              <CommandInput placeholder="検索..." />
                              <CommandEmpty>見つかりません</CommandEmpty>
                              <CommandGroup>
                                {[
                                  "しっぽり", "わいわい", "カジュアルに", "おしゃれに",
                                  "パーっと", "飲み歩き", "食事にこだわりたい", "お酒にこだわりたい",
                                  "立ち飲み系", "居酒屋系", "レストラン系", "バー系",
                                  "歌いたい", "クラブ系", "アミューズメント系", "オンライン呑み"
                                ].map((mood) => (
                                  <CommandItem
                                    key={mood}
                                    value={mood}
                                    onSelect={() => field.onChange([mood])}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value?.[0] === mood ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {mood}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full rounded-full neon-bg">
                  {isLoading ? "保存中..." : (hasExistingGroup ? "グループを更新" : "グループを作成")}
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