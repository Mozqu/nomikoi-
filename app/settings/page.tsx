"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, ChevronLeft, ChevronRight, LogOut, Settings } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { auth, db } from "@/app/firebase/config"
import { signOut } from "firebase/auth"
import { useParams, useRouter } from "next/navigation"
import ImageForm from "@/components/setting/image-form"
import { OptionalStatusRadio, OptionalStatusCheck } from "@/components/setting/optional-status"
import { getDoc, updateDoc } from "firebase/firestore"
import { doc } from "firebase/firestore"
import fs from "fs"
import path from "path"


const options = {
  "height": {
    "label": "身長",
    "type": "radio",
    "options": [
      "130cm", "131cm", "132cm", "133cm", "134cm", "135cm",
      "136cm", "137cm", "138cm", "139cm", "140cm",
      "141cm", "142cm", "143cm", "144cm", "145cm", "146cm",
      "147cm", "148cm", "149cm", "150cm", "151cm", "152cm",
      "153cm", "154cm", "155cm", "156cm", "157cm", "158cm",
      "159cm", "160cm", "161cm", "162cm", "163cm", "164cm",
      "165cm", "166cm", "167cm", "168cm", "169cm", "170cm",
      "171cm", "172cm", "173cm", "174cm", "175cm", "176cm",
      "177cm", "178cm", "179cm", "180cm", "181cm", "182cm",
      "183cm", "184cm", "185cm", "186cm", "187cm", "188cm",
      "189cm", "190cm", "191cm", "192cm", "193cm", "194cm",
      "195cm", "196cm", "197cm", "198cm", "199cm", "200cm"
    ]
  },
  "bodyType": {
    "label": "体型",
    "type": "radio",
    "options": [
      "細身",
      "普通",
      "筋肉質",
      "ややぽっちゃり",
      "ぽっちゃり",
      "その他（自由記入）"
    ]
  },
  "bloodType": {
    "label": "血液型",
    "type": "radio",
    "options": ["A", "B", "AB", "O", "不明"]
  },
  "location": {
    "label": "居住地",
    "type": "radio",
    "options": [
      "北海道", "青森県", "岩手県", "宮城県", "秋田県",
      "山形県", "福島県", "茨城県", "栃木県", "群馬県",
      "埼玉県", "千葉県", "東京都", "神奈川県", "新潟県",
      "富山県", "石川県", "福井県", "山梨県", "長野県",
      "岐阜県", "静岡県", "愛知県", "三重県", "滋賀県",
      "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県",
      "鳥取県", "島根県", "岡山県", "広島県", "山口県",
      "徳島県", "香川県", "愛媛県", "高知県", "福岡県",
      "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県",
      "鹿児島県", "沖縄県"
    ]
  },
  "origin": {
    "label": "出身地",
    "type": "radio",
    "options": [
      "北海道", "青森県", "岩手県", "宮城県", "秋田県",
      "山形県", "福島県", "茨城県", "栃木県", "群馬県",
      "埼玉県", "千葉県", "東京都", "神奈川県", "新潟県",
      "富山県", "石川県", "福井県", "山梨県", "長野県",
      "岐阜県", "静岡県", "愛知県", "三重県", "滋賀県",
      "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県",
      "鳥取県", "島根県", "岡山県", "広島県", "山口県",
      "徳島県", "香川県", "愛媛県", "高知県", "福岡県",
      "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県",
      "鹿児島県", "沖縄県"
    ]
  },
  "job": {
    "label": "職種",
    "type": "radio",
    "options": [
      "大手企業",
      "公務員",
      "受付",
      "事務員",
      "看護師",
      "客室乗務員",
      "秘書",
      "教育関連",
      "福祉・介護",
      "アパレル・ショップ",
      "美容関係",
      "ブライダル",
      "金融",
      "保険",
      "広告",
      "マスコミ",
      "WEB業界",
      "上場企業",
      "経営者・役員",
      "医師",
      "薬剤師",
      "弁護士",
      "公認会計士",
      "パイロット",
      "大手商社",
      "コンサル",
      "大手外資",
      "外資金融",
      "IT関連",
      "クリエイター",
      "アナウンサー",
      "芸能・モデル",
      "イベントコンパニオン",
      "スポーツ選手",
      "接客業",
      "不動産",
      "建築関連",
      "通信",
      "流通",
      "製薬",
      "食品関連",
      "旅行関係",
      "エンターテイメント",
      "会社員",
      "自由業",
      "税理士",
      "エンジニア",
      "建築士",
      "美容師",
      "歯科医師",
      "歯科衛生士",
      "バーテンダー",
      "料理人",
      "飲食関連",
      "その他"
    ]
  },
  "jobName": {
    "label": "職業名",
    "type": "text",
    "options": [
      "自由記入"
    ]
  },
  "education": {
    "label": "学歴",
    "type": "radio",
    "options": [
      "高校卒",
      "専門学校卒",
      "短大卒",
      "大学卒",
      "大学院卒",
      "その他"
    ]
  },
  "income": {
    "label": "年収",
    "type": "radio",
    "options": [
      "～200万円",
      "200～400万円",
      "400～600万円",
      "600～800万円",
      "800～1000万円",
      "1000〜1500万円",
      "1500〜2000万円",
      "2000〜2500万円",
      "2500〜3000万円"
    ]
  },
  "tobacco": {
    "label": "タバコ",
    "type": "radio",
    "options": [
      "吸う",
      "吸う（電子タバコ）",
      "非喫煙者の前では吸わない",
      "相手が嫌ならやめる",
      "ときどき吸う"
    ]
  },
  "siblings": {
    "label": "兄弟・姉妹構成",
    "type": "check",
    "options": [
      "一人っ子",
      "兄一人",
      "兄複数",
      "姉一人",
      "姉複数",
      "弟一人",
      "弟複数",
      "妹一人",
      "妹複数"
    ]
  },
  "language": {
    "label": "話せる言語",
    "type": "check",
    "options": [
      "日本語",
      "英語",
      "中国語",
      "韓国語",
      "その他（自由記入）"
    ]
  },
  "school": {
    "label": "学校名",
    "type": "text",
    "options": [
      "自由記入"
    ]
  },
  "marriage": {
    "label": "結婚歴",
    "type": "radio",
    "options": [
      "独身（未婚）",
      "独身（離婚）",
      "独身（死別）"
    ]
  },
  "child": {
    "label": "子供の有無",
    "type": "radio",
    "options": [
      "なし",
      "同居中",
      "別居中"
    ]
  },
  "childIntent": {
    "label": "子供が欲しいか",
    "type": "radio",
    "options": [
      "欲しい",
      "欲しくない",
      "相手次第",
      "わからない"
    ]
  },
  "childcare": {
    "label": "家事・育児",
    "type": "radio",
    "options": [
      "積極的に参加したい",
      "できれば参加したい",
      "二人でシェアしたい",
      "できれば相手にまかせたい",
      "相手に任せたい"
    ]
  },
  "meeting": {
    "label": "出会うまでの希望",
    "type": "radio",
    "options": [
      "マッチング後にまずは飲みに行きたい",
      "気が合えば会いたい",
      "メッセージで十分確認したい",
      "電話・ビデオで事前にコミュニケーションを取りたい",
      "状況に応じて柔軟に対応したい"
    ]
  },
  "expense": {
    "label": "デート費用",
    "type": "radio",
    "options": [
      "割り勘",
      "男性が多めに負担",
      "女性が多めに負担",
      "シチュエーションに応じて"
    ]
  },
  "type": {
    "label": "１６タイプ (MBTI)",
    "type": "radio",
    "options": [
      "ISTJ",
      "ISFJ",
      "INFJ",
      "INTJ",
      "ISTP",
      "ISFP",
      "INFP",
      "INTP",
      "ESTP",
      "ESFP",
      "ENFP",
      "ENTP",
      "ESTJ",
      "ESFJ",
      "ENFJ",
      "ENTJ"
    ]
  },
  "roommate": {
    "label": "同居人",
    "type": "radio",
    "options": [
      "一人暮らし",
      "実家暮らし",
      "ルームシェア",
      "ペットと一緒",
      "その他"
    ]
  },
  "pet": {
    "label": "飼っているペット",
    "type": "check",
    "options": [
      "なし",
      "犬",
      "猫",
      "犬と猫",
      "小動物（ウサギ、ハムスターなど）",
      "爬虫類",
      "魚",
      "その他"
    ]
  },
  "holiday": {
    "label": "休日",
    "type": "radio",
    "options": [
      "土日",
      "平日",
      "不定期",
      "その他"
    ]
  }
}


export default function SettingsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const params = useParams()
  const [userData, setUserData] = useState<any>(null)
  const currentUserId = auth?.currentUser?.uid
  const isOwnProfile = params.id === currentUserId


  const handleLogout = async () => {
    setIsLoading(true)
    try {
      if (auth) {
        await signOut(auth)
        router.push("/login")
      }
    } catch (error) {
      console.error("ログアウトに失敗しました:", error)
    } finally {
      setIsLoading(false)
    }
  }

  

  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (auth?.currentUser?.uid && db) {
          const userRef = doc(db, "users", auth.currentUser.uid)
          const userDoc = await getDoc(userRef)
          if (userDoc.exists()) {
            setUserData({ id: userDoc.id, ...userDoc.data() })
          }
        }
      } catch (error) {
        console.error("ユーザー情報の取得に失敗しました:", error)
      }
    }

    fetchUser()
  }, [])

  const handleSaveBio = async () => {
    if (!auth?.currentUser?.uid || !db || !userData) return;
    
    try {
      const userRef = doc(db, "users", auth.currentUser.uid)
      await updateDoc(userRef, {
        bio: userData.bio || "",
        updatedAt: new Date()
      })
      alert("自己紹介を保存しました")
    } catch (error) {
      console.error("自己紹介の保存に失敗しました:", error)
      alert("自己紹介の保存に失敗しました")
    }
  }

  return (
    
    <>
        {/* ヘッダー */}
        <div className="w-full p-2 flex justify-between items-center">
          {/* Back button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md border border-white/10"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
  
        </div>

        {currentUserId && (
          <div className="overflow-y-auto">

            {/* Profile Completion */}
            <div className="space-y-4 p-4">
              <h2 className="text-xl font-bold">プロフィール設定</h2>
              <button 
                className="w-full flex items-center justify-between p-4 rounded-full border"
                onClick={() => router.push('/register/way_of_drinking')}
              >
                <span>もう一度お酒の質問に答える</span>
                <ArrowLeft size={20} className="rotate-180" />
              </button>
            </div>

            <ImageForm /> 

            {/* textarea bio */}
            <div className="p-4">
              <h2 className="text-xl font-bold">自己紹介</h2>
              <textarea 
                className="w-full mt-3 p-2 border border-gray-300 bg-transparent rounded-md"
                rows={5}
                placeholder="あなたについて教えて下さい"
                value={userData?.bio || ""}
                onChange={(e) => setUserData({ ...userData, bio: e.target.value })}
              />
              <Button 
                className="w-full mt-3 neon-bg"
                onClick={handleSaveBio}
              >
                保存
              </Button>
            </div>

            {/* 基本情報 */}  
            {Object.entries(options).map(([key, value]) => (
              value.type === "radio" ? (
                <OptionalStatusRadio 
                  key={key}
                  title={key}
                  label={value.label}
                  options={value.options}
                  userData={userData} 
                />
              ) : value.type === "check" ? (
                <OptionalStatusCheck 
                  key={key}
                  title={key}
                  label={value.label}
                  options={value.options}
                  userData={userData}
                />
              ) : value.type === "text" ? (
                <div key={key} className="p-4 space-y-4">
                  <h2 className="text-xl font-bold">{value.label}</h2>
                  <input
                    type="text"
                    className="w-full p-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder={`${value.label}を入力してください`}
                    value={userData?.profile?.[value.label] || ""}
                    onChange={(e) => {
                      setUserData({
                        ...userData,
                        profile: {
                          ...userData?.profile,
                          [value.label]: e.target.value
                        }
                      });
                    }}
                    onBlur={async (e) => {
                      if (!auth?.currentUser?.uid || !db) return;
                      try {
                        const userRef = doc(db, "users", auth.currentUser.uid);
                        await updateDoc(userRef, {
                          [`profile.${value.label}`]: e.target.value,
                          updatedAt: new Date()
                        });
                      } catch (error) {
                        console.error(`${value.label}の更新に失敗しました:`, error);
                      }
                    }}
                    style={{
                      backgroundColor: "transparent",
                      borderBottom: "1px solid white",
                      outline: "none",
                      boxShadow: "none",
                      color: "#aaa"
                    }}
                  />
                </div>
              ) : null
            ))}

          </div>
        )}


    </>
  )
} 