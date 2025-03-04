"use client"
import dynamic from 'next/dynamic'
import { useState, useEffect } from "react"
import { doc, updateDoc } from "firebase/firestore"
import { auth, db } from "@/app/firebase/config"
import { Badge } from '../ui/badge'
import { CheckIcon } from 'lucide-react'

interface OptionalStatusRadioProps {
  title: string;
  label: string;
  options: string[];
  userData: any;
}

// クライアントサイドのみでレンダリングされるコンポーネントとして設定
export const OptionalStatusRadio = dynamic(
  () => Promise.resolve(({title, label, options, userData }: OptionalStatusRadioProps) => {
    const [selectedValue, setSelectedValue] = useState(() => {
      // プロフィールデータから初期値を取得
      return userData?.profile?.[title] || ""
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
      console.log('handleChange開始:', e.target.value)
      if (!auth.currentUser || isSubmitting) {
        console.log('処理をスキップ:', { isAuthenticated: !!auth.currentUser, isSubmitting })
        return
      }

      const newValue = e.target.value
      setSelectedValue(newValue)
      setIsSubmitting(true)

      try {
        const userRef = doc(db, "users", auth.currentUser.uid)
        await updateDoc(userRef, {
          [`profile.${title}`]: newValue,
          updatedAt: new Date()
        })
        console.log(`更新成功: ${title} => ${newValue}`)
      } catch (error) {
        console.error("更新エラー:", error)
        setSelectedValue(userData?.profile?.[title] || '') // エラー時に前の値に戻す
        alert("設定の更新に失敗しました。もう一度お試しください。")
      } finally {
        setIsSubmitting(false)
        console.log('handleChange完了')
      }
    }

    return (
      <div className="p-4 space-y-4">
        <h2 className="text-xl font-bold">{label}</h2>
        <select 
          value={selectedValue}
          onChange={(e) => {
            console.log('onChange:', e.target.value)
            handleChange(e)
          }}
          className="w-full p-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
          style={{
            backgroundColor: "transparent",
            borderBottom: "1px solid white",
            outline: "none",
            boxShadow: "none",
            color: "#aaa",
          }}
        >
          <option value="">選択してください</option>
          {options.map((option: string) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>

      {selectedValue === "その他（自由記入）" && (
        <input
          type="text"
          placeholder="その他の詳細を入力"
          className="w-full mt-4 p-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
          style={{
            backgroundColor: "transparent", 
            borderBottom: "1px solid white",
            outline: "none",
            boxShadow: "none",
            color: "#aaa"
          }}
          onKeyDown={async (e) => {
            if (e.key !== 'Enter') return;
            if (!auth.currentUser || isSubmitting) return;
            
            setIsSubmitting(true);
            try {
              const userRef = doc(db, "users", auth.currentUser.uid);
              await updateDoc(userRef, {
                [`profile.${title}detail`]: e.target.value,
                updatedAt: new Date()
              });
            } catch (error) {
              console.error("更新エラー:", error);
              alert("設定の更新に失敗しました。");
            } finally {
              setIsSubmitting(false);
            }
          }}
        />
      )}
      </div>
    )
  }),
  { ssr: false }
)

// チェックボックス用のコンポーネント
export const OptionalStatusCheck = dynamic(
  () => Promise.resolve(({title, label, options, userData}: OptionalStatusRadioProps) => {
    const [selectedValues, setSelectedValues] = useState<string[]>(() => {
      // プロフィールデータから初期値を取得
      return userData?.profile?.[title] || []
    })

    console.log("title", title)
    console.log("label", label)
    console.log("options", options)
    console.log("userData", userData)

    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleChange = async (option: string, checked: boolean) => {
      if (!auth.currentUser || isSubmitting) return

      setIsSubmitting(true)
      const newValues = checked 
        ? [...selectedValues, option]
        : selectedValues.filter(v => v !== option)

      try {
        const userRef = doc(db, "users", auth.currentUser.uid)
        await updateDoc(userRef, {
          [`profile.${title}`]: newValues,
          updatedAt: new Date()
        })
        setSelectedValues(newValues)
      } catch (error) {
        console.error("更新エラー:", error)
        alert("設定の更新に失敗しました。")
      } finally {
        setIsSubmitting(false)
      }
    }

    return (    
      <div className="p-4 space-y-4">
        <h2 className="text-xl font-bold">{label}</h2>
        <div className="flex flex-wrap gap-4">
          {options.map((option: string) => (
            <div key={option} className="">

                <input
                    type="checkbox"
                    id={option}
                    value={option}
                    checked={selectedValues.includes(option)}
                    onChange={(e) => {
                        handleChange(option, e.target.checked)
                        console.log("selectedValues", selectedValues)
                    }}
                    className=""
                    style={{
                        display: "none",
                    }}
                />
                <label 
                    htmlFor={option} 
                    className={`text-lg px-4 py-2 font-medium rounded-full border border-gray-400 focus:ring-2 focus:ring-purple-600
                    ${selectedValues.includes(option) ? "pink-border text-white" : ""}`}>
                        {selectedValues.includes(option) ? <CheckIcon className="w-4 h-4 mr-2 inline-block" /> : ""}
                        {option}
                </label>
            </div>
          ))}
        </div>
      </div>
    )
  }),
  { ssr: false }
)
  