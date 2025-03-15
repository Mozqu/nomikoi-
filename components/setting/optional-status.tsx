"use client"
import dynamic from 'next/dynamic'
import { useState, useEffect, useLayoutEffect } from "react"
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
      // 初期値を設定
      return userData?.profile?.[title] || ""
    })
    const [text, setText] = useState(userData?.profile?.[`${title}Detail`] || "")
    const [isSubmitting, setIsSubmitting] = useState(false)

    // userDataが変更されたら値を更新
    useEffect(() => {
      if (userData?.profile?.[title]) {
        setSelectedValue(userData.profile[title])
        setText(userData.profile[`${title}Detail`] || "")
      }
    }, [userData, title])

    


    const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (!auth?.currentUser || !db || isSubmitting) {
        console.log('処理をスキップ:', { isAuthenticated: !!auth?.currentUser, isSubmitting })
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

    const handleDetailChange = async (detailValue: string) => {
      if (!auth?.currentUser || !db || isSubmitting) return;
      
      setIsSubmitting(true);
      try {
        const userRef = doc(db, "users", auth.currentUser.uid);
        await updateDoc(userRef, {
          [`profile.${title}Detail`]: detailValue,
          updatedAt: new Date()
        });
        console.log(`詳細更新成功: ${title}Detail => ${detailValue}`);
      } catch (error) {
        console.error("詳細更新エラー:", error);
        alert("設定の更新に失敗しました。");
      } finally {
        setIsSubmitting(false);
      }
    }

    return (
      <div className="p-4 space-y-4">
        <h2 className="text-xl font-bold">{userData?.profile?.[title] ? userData.profile[title] : title}</h2>
        <select 
          key={selectedValue}
          defaultValue={selectedValue}
          onChange={(e) => {
            console.log('onChange:', e.target.value)
            handleChange(e)
          }}
          className="w-full p-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
          style={{
            backgroundColor: "transparent",
            borderBottom: selectedValue ? "1px solid white" : "1px solid #00fff7",
            outline: "none",
            boxShadow: "none",
            color: "#aaa",
          }}
        >
          <option value="" disabled={!!selectedValue}>
            {selectedValue ? selectedValue : "選択してください"}
          </option>
          {options.map((option: string) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>

      {selectedValue === "その他（自由記入）" && (
        <input
          type="text"
          className="w-full mt-4 p-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder={userData?.profile?.[`${title}Detail`] ?? "その他の詳細を入力"}
          value={text}
          onChange={(e) => {
            setText(e.target.value)
          }}
          style={{
            backgroundColor: "transparent", 
            borderBottom: "1px solid white",
            outline: "none",
            boxShadow: "none",
            color: "#aaa"
          }}
          onKeyDown={async (e) => {
            if (e.key !== 'Enter') return;
            handleDetailChange(e.currentTarget.value);
          }}
          onBlur={(e) => {
            handleDetailChange(e.currentTarget.value);
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
      return Array.isArray(userData?.profile?.[title]) ? userData.profile[title] : []
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    // userDataが変更されたら値を更新
    useEffect(() => {
      if (userData?.profile && userData.profile[title]) {
        setSelectedValues(Array.isArray(userData.profile[title]) 
          ? userData.profile[title] 
          : [])
      }
    }, [userData, title])

    const handleChange = async (option: string, checked: boolean) => {
      if (!auth?.currentUser || !db || isSubmitting) return

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
        console.log(`更新成功: ${title} => ${newValues.join(', ')}`)
      } catch (error) {
        console.error("更新エラー:", error)
        alert("設定の更新に失敗しました。")
      } finally {
        setIsSubmitting(false)
      }
    }


    return (    
      <div className="p-4 space-y-4">
        <h2 className="text-xl font-bold">{userData?.profile?.[title]?.length > 0 ? userData.profile[title].join(', ') : title}</h2>
        <div className="flex flex-wrap gap-4">
          {options.map((option: string) => (
            <div key={option} className="">

                <input
                    type="checkbox"
                    id={`${title}-${option}`}
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
                    htmlFor={`${title}-${option}`} 
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
  