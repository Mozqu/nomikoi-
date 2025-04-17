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
import EventList from "@/app/components/home/events/eventList"

// イベントのフォームスキーマ定義
const eventFormSchema = z.object({
  title: z.string().min(1, "タイトルを入力してください"),
  description: z.string().min(1, "説明を入力してください"),
  memberNum: z.number().min(2, "2人以上を選択してください"),
  gender: z.enum(["male", "female", "both"]),
  startedAt: z.string().min(1, "開始日時を入力してください"),
  eventArea: z.array(z.string()).min(1, "エリアを選択してください"),
})

type EventFormValues = z.infer<typeof eventFormSchema>

// イベント型の定義
interface Event {
  id: string;
  title: string;
  createdBy: string;
  createdAt: any;
  updatedAt: any;
  description: string;
  memberNum: number;
  gender: "male" | "female" | "both";
  invitedBy: string[];
  startedAt: string;
  eventArea: string[];
}

export default function EventTab() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [stations, setStations] = useState<Array<{name: string, prefecture: string, line: string}>>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedStations, setSelectedStations] = useState<string[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [userGender, setUserGender] = useState<"male" | "female" | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

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

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      description: "",
      memberNum: 2,
      gender: userGender || "both",
      startedAt: "",
      eventArea: [],
    },
  })

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
      form.setValue("eventArea", newStations)
      setSearchQuery("") // 入力フィールドをクリア
      setStations([]) // 検索結果をクリア
    }
  }

  // 駅名削除時の処理
  const handleStationRemove = (stationName: string) => {
    const newStations = selectedStations.filter(name => name !== stationName)
    setSelectedStations(newStations)
    form.setValue("eventArea", newStations)
  }

  // フォームリセット時の処理
  const handleFormReset = () => {
    form.reset()
    setSearchQuery("")
    setStations([])
    setSelectedStations([])
  }

  async function onSubmit(data: EventFormValues) {
    try {
      setIsLoading(true)
      if (!auth || !auth.currentUser) {
        throw new Error("ユーザーが認証されていません")
      }

      if (!db) {
        throw new Error("データベースが初期化されていません")
      }

      const eventData = {
        ...data,
        gender: userGender || "both", // ユーザーの性別を設定
        createdBy: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        invitedBy: [],
      }

      const eventsRef = collection(db, "events")
      await addDoc(eventsRef, eventData)
      
      handleFormReset() // フォームをリセット
      setIsDialogOpen(false) // ダイアログを閉じる
      setRefreshTrigger(prev => prev + 1) // 一覧を更新

      toast({
        title: "イベントを作成しました",
        description: "新しいイベントが作成されました。",
      })
    } catch (error) {
      console.error("イベントの作成に失敗しました:", error)
      toast({
        variant: "destructive",
        title: "エラー",
        description: "イベントの作成に失敗しました。",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container w-full p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">イベントマッチ</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="rounded-full">
              <Plus className="h-5 w-5 mr-2" />
              イベントを作成
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto bg-gray-900 border-none rounded-xl">
            <DialogHeader>
              <DialogTitle>イベントを作成</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                {/* タイトル */ }
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>タイトル</FormLabel>
                            <FormControl>
                                <Input
                                    className="form-input"
                                    {...field}
                                />
                            </FormControl>  
                            <FormMessage />
                        </FormItem>
                    )}
                />  

                {/* 募集人数 */}  
                <FormField
                  control={form.control}
                  name="memberNum"
                  render={({ field }) => (
                    <FormItem className="flex gap-2">
                      <FormLabel className="w-1/2 flex justify-center items-center"><span className="">人数（必須）</span></FormLabel>
                      <FormControl>
                        <Input
                          className="form-input"
                          type="number"
                          min={2}
                          value={field.value}
                          onChange={(e) => {
                            const value = e.target.value ? parseInt(e.target.value, 10) : 2;
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 開始日時 */}
                <FormField
                  control={form.control}
                  name="startedAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>開始日時（必須）</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* エリア選択 */}
                <FormField
                  control={form.control}
                  name="eventArea"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>エリア（必須）</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                            <Input
                                type="text"
                                placeholder="駅名を検索"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value)
                                    searchStations(e.target.value)
                                }}
                            />
                          
                            {stations.length > 0 && (
                                <div className="bg-gray-800 rounded-md p-2 max-h-40 overflow-y-auto">
                                {stations.map((station, index) => (
                                    <div
                                        key={`${station.name}-${index}`}
                                        className="px-3 py-2 hover:bg-gray-700 cursor-pointer rounded-sm"
                                        onClick={() => handleStationSelect(station.name)}
                                    >
                                    {station.name}
                                    <span className="text-xs text-gray-400 ml-2">
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
                                        onClick={() => handleStationRemove(stationName)}
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

                {/* イベントコメント */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>イベントコメント</FormLabel>
                      <FormControl>
                        <Textarea
                          className="form-input"
                          placeholder="イベントの説明を入力してください"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button className="w-full rounded-full neon-bg" type="submit" disabled={isLoading}>
                  {isLoading ? "作成中..." : "イベントを作成"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      <EventList refreshTrigger={refreshTrigger} />
    </div>
  )
} 