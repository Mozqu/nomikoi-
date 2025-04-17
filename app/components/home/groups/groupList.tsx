"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { auth, db } from "@/app/firebase/config"
import { collection, query, orderBy, limit, getDocs, startAfter, QueryDocumentSnapshot, doc, getDoc, setDoc, where, serverTimestamp } from "firebase/firestore"
import { LoadingSpinner } from "@/app/components/ui/loading-spinner"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"

interface User {
  id: string;
  profileImage: string;
  name: string;
  address: string;
  age: number;
  job: string;
}

// 生年月日から年齢を計算する関数
const calculateAge = (birthday: any): number => {
  if (!birthday) return 0;
  
  let birthDate: Date;
  
  // Firestoreのタイムスタンプの場合
  if (birthday && typeof birthday.toDate === 'function') {
    birthDate = birthday.toDate();
  } 
  // 既にDateオブジェクトの場合
  else if (birthday instanceof Date) {
    birthDate = birthday;
  }
  // タイムスタンプ（ミリ秒）の場合
  else if (typeof birthday === 'number') {
    birthDate = new Date(birthday);
  }
  // YYYY-MM-DD形式の文字列の場合
  else if (typeof birthday === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(birthday)) {
    birthDate = new Date(birthday);
  }
  // その他の場合は0を返す
  else {
    return 0;
  }

  // 不正な日付の場合は0を返す
  if (isNaN(birthDate.getTime())) {
    return 0;
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

// グループ型の定義
interface Group {
  id: string;
  createdBy: string; // UIDのみを保持
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
  };
  creator?: User; // 取得したユーザー情報を保持
}

export default function GroupList({ refreshTrigger }: { refreshTrigger?: number }) {
  const router = useRouter()
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [myGroupId, setMyGroupId] = useState<string | null>(null)

  const fetchUserData = async (uid: string): Promise<User | null> => {
    try {
      if (!db) return null
      if (!uid) {
        console.error("ユーザーIDが指定されていません")
        return null
      }
      
      const userDoc = await getDoc(doc(db, "users", uid))
      if (userDoc.exists()) {
        const userData = userDoc.data()
        if (!userData) {
          console.error("ユーザーデータが空です")
          return null
        }

        return {
          id: userDoc.id,
          profileImage: userData.photos?.[0]?.url || "/default-profile.png",
          name: userData.name || "名無しユーザー",
          address: userData.profile?.居住地 || "",
          age: calculateAge(userData.birthday) || 0,
          job: userData.profile?.職種 || ""
        }
      }

      console.error(`ユーザー(${uid})が見つかりません`)
      return null
    } catch (err) {
      console.error("ユーザー情報の取得に失敗しました:", err)
      return null
    }
  }

  const fetchGroups = async () => {
    try {
      if (!db || !auth?.currentUser) return

      // ログインユーザーの性別を取得
      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid))
      const userGender = userDoc.data()?.gender

      const groupsRef = collection(db, "groups")
      let q = query(
        groupsRef,
        orderBy("createdAt", "desc")
      )
      console.log("userGender", userGender)

      // 性別でフィルタリング
      if (userGender === '女性') {
        q = query(q, where("gender", "==", "男性"))
      } else if (userGender === '男性') {
        q = query(q, where("gender", "==", "女性"))
      }

      q = query(q, limit(10))

      const snapshot = await getDocs(q)
      const groupData = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const data = doc.data()
          const creator = await fetchUserData(data.createdBy)
          if (!creator) {
            console.error(`グループ(${doc.id})の作成者情報が取得できませんでした`)
          }
          return {
            id: doc.id,
            ...data,
            creator: creator || {
              id: data.createdBy,
              profileImage: "/default-profile.png",
              name: "不明なユーザー",
              address: "",
              age: 0,
              job: ""
            }
          }
        })
      ) as Group[]

      setGroups(groupData)
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null)
      setHasMore(snapshot.docs.length === 10)
    } catch (err) {
      console.error("グループの取得に失敗しました:", err)
      setError("グループの取得に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  const loadMore = async () => {
    if (!lastDoc || !hasMore || !db) return

    try {
      setLoading(true)
      const groupsRef = collection(db, "groups")
      const q = query(
        groupsRef,
        orderBy("createdAt", "desc"),
        startAfter(lastDoc),
        limit(10)
      )

      const snapshot = await getDocs(q)
      const newGroupData = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const data = doc.data()
          const creator = await fetchUserData(data.createdBy)
          if (!creator) {
            console.error(`グループ(${doc.id})の作成者情報が取得できませんでした`)
          }
          return {
            id: doc.id,
            ...data,
            creator: creator || {
              id: data.createdBy,
              profileImage: "/default-profile.png",
              name: "不明なユーザー",
              address: "",
              age: 0,
              job: ""
            }
          }
        })
      ) as Group[]

      setGroups(prev => [...prev, ...newGroupData])
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null)
      setHasMore(snapshot.docs.length === 10)
    } catch (err) {
      console.error("追加のグループ取得に失敗しました:", err)
      setError("追加のグループ取得に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  const fetchMyGroupId = async () => {
    if (!auth?.currentUser || !db) return null
    
    try {
      const myGroupsRef = collection(db, "groups")
      const myGroupQuery = query(myGroupsRef, where("createdBy", "==", auth.currentUser.uid))
      const myGroupSnapshot = await getDocs(myGroupQuery)
      
      if (!myGroupSnapshot.empty) {
        setMyGroupId(myGroupSnapshot.docs[0].id)
      }
    } catch (error) {
      console.error("自分のグループIDの取得に失敗:", error)
    }
  }

  useEffect(() => {
    fetchGroups()
  }, [refreshTrigger])

  useEffect(() => {
    fetchMyGroupId()
  }, [auth?.currentUser])

  const handleInviteGroup = async (group: Group, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!auth?.currentUser || !db || !myGroupId) return

    try {
      // ターゲットグループのinvitedByを更新
      const targetGroupRef = doc(db, "groups", group.id)
      const targetGroupDoc = await getDoc(targetGroupRef)

      console.log("targetGroupDoc", targetGroupDoc.data())
      console.log("myGroupId", myGroupId)
      
      if (targetGroupDoc.exists()) {
        const currentInvitedBy = targetGroupDoc.data().invitedBy || []
        if (!currentInvitedBy.includes(myGroupId)) {
          await setDoc(targetGroupRef, {
            invitedBy: [...currentInvitedBy, myGroupId],
            updatedAt: serverTimestamp()
          }, { merge: true })
        }
      }

      // 既存のメッセージルームを検索
      const roomsRef = collection(db, "message_rooms")
      const q = query(roomsRef, 
        where("user_ids", "==", [group.createdBy]),
        where("type", "==", "group"),
        where("groupId", "==", group.id),
        where("submitBy", "==", auth.currentUser.uid)
      )
      const querySnapshot = await getDocs(q)

      let roomId

      if (querySnapshot.empty) {
        // 既存のルームがない場合は新規作成
        const newRoomRef = doc(roomsRef)
        await setDoc(newRoomRef, {
          user_ids: [group.createdBy],
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
          visitedUsers: {},
          type: 'group',
          groupId: group.id,
          permission: false,
          submitBy: auth.currentUser.uid
        })
        roomId = newRoomRef.id
      } else {
        // 既存のルームがある場合はそのIDを使用
        roomId = querySnapshot.docs[0].id
      }

    } catch (error) {
      console.error("メッセージルームの作成に失敗:", error)
    }
  }

  if (error) {
    return <div className="text-red-500 text-center py-4">{error}</div>
  }

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {groups.map((group) => (
          <motion.div
            key={group.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-gray-800 rounded-lg shadow-lg flex cursor-pointer hover:bg-gray-700 transition-colors"
            onClick={() => {
              setSelectedGroup(group)
              setIsDialogOpen(true)
            }}
          >
            {/* createdByのユーザーのプロフィール画像を表示 */}
            <div className="relative w-24 h-24">
                <Image src={group.creator?.profileImage || "/default-profile.png"} alt="プロフィール画像" width={50} height={50} className="rounded-xl relative w-full h-full" style={{ objectFit: "cover" }}    />
                <span className="text-sm bg-blue-400 text-white px-2 py-1 rounded-full absolute top-[-10px] left-[-10px]">
                        {group.memberNum}人
                </span>

                <div className="absolute bottom-0 right-0 bg-black/50 rounded-lg p-1 w-full">
                    <div className="flex flex-wrap space-x-1">   
                        <span style={{ fontSize: "8px" }}>
                            {String(group.creator?.age || 0)}歳
                        </span>

                        <span style={{ fontSize: "8px" }}>
                            {group.creator?.address}
                        </span>
                        <span style={{ fontSize: "8px" }}>
                            {group.creator?.job}
                        </span>

                    </div>
                </div>
            </div>
            <div className="flex-1 p-2">

                <div className="flex justify-end gap-2">
                    {group.preferences.favoriteArea?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {group.preferences.favoriteArea.map((area, index) => (
                        <span
                            key={index}
                            className="bg-gray-700 text-gray-300 px-2 py-1 rounded-full text-xs"
                        >
                            {area}
                        </span>
                        ))}
                    </div>
                    )}

                </div>

                <p className="text-gray-200 mb-3">{group.description}</p>
                
                <div className="flex justify-end gap-2">
                    <button
                        className={`${
                            auth?.currentUser && myGroupId && group.invitedBy?.includes(myGroupId)
                            ? "bg-gray-600 hover:bg-gray-700"
                            : "bg-pink-600 hover:bg-pink-700"
                        } text-white text-xs px-2 py-1 rounded-full`}
                        onClick={(e) => handleInviteGroup(group, e)}
                        disabled={!!(auth?.currentUser && myGroupId && group.invitedBy?.includes(myGroupId))}
                    >
                        {auth?.currentUser && myGroupId && group.invitedBy?.includes(myGroupId)
                            ? "招待済み"
                            : "Myグループでお誘いする"}
                    </button>
                </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* 詳細ダイアログ */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-gray-900 rounded-lg border-none">
          <DialogHeader>
            <DialogTitle>グループ詳細</DialogTitle>
          </DialogHeader>
          
          {selectedGroup && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                {/* プロフィール情報 */}
                <div className="relative w-24 h-24">
                    <Image 
                    src={selectedGroup.creator?.profileImage || "/default-profile.png"} 
                    alt="プロフィール画像" 
                    width={50} 
                    height={50} 
                    className="rounded-xl relative w-full h-full" 
                    style={{ objectFit: "cover" }}    
                    />
                    <span className="text-sm bg-blue-400 text-white px-2 py-1 rounded-full absolute top-[-10px] left-[-10px]">
                    {selectedGroup.memberNum}人
                    </span>

                    <div className="absolute bottom-0 right-0 bg-black/50 rounded-lg p-1 w-full">
                    <div className="flex flex-wrap space-x-1">   
                        <span style={{ fontSize: "8px" }}>
                        {String(selectedGroup.creator?.age || 0)}歳
                        </span>
                        <span style={{ fontSize: "8px" }}>
                        {selectedGroup.creator?.address}
                        </span>
                        <span style={{ fontSize: "8px" }}>
                        {selectedGroup.creator?.job}
                        </span>
                    </div>
                    </div>
                </div>
              

                {/* グループ説明 */}
                <div className="p-4 rounded-lg flex-1">
                    <p className="text-gray-300">{selectedGroup.description}</p>
                </div>
              </div>

              {/* タグ一覧 */}
              <div className="space-y-4">
                  {/* エリア */}
                  {selectedGroup.preferences.favoriteArea?.length > 0 && (
                    <div>
                        <h3 className="font-semibold mb-2">希望エリア</h3>
                        <div className="flex flex-wrap gap-2">
                        {selectedGroup.preferences.favoriteArea.map((area, index) => (
                            <span
                                key={index}
                                className="bg-gray-700 text-gray-300 px-2 py-1 rounded-full text-sm"
                            >
                                {area}
                            </span>
                        ))}
                        </div>
                    </div>
                  )}

                  {/* 時間帯 */}
                  {selectedGroup.preferences.favoriteTime?.length > 0 && (
                  <div>
                      <h3 className="font-semibold mb-2">希望時間帯</h3>
                      <div className="flex flex-wrap gap-2">
                      {selectedGroup.preferences.favoriteTime.map((time, index) => (
                          <span
                          key={index}
                          className="bg-gray-700 text-gray-300 px-2 py-1 rounded-full text-sm"
                          >
                          {time}
                          </span>
                      ))}
                      </div>
                  </div>
                  )}

                  {/* 雰囲気 */}
                  {selectedGroup.preferences.favoriteMood?.length > 0 && (
                  <div>
                      <h3 className="font-semibold mb-2">希望する雰囲気</h3>
                      <div className="flex flex-wrap gap-2">
                      {selectedGroup.preferences.favoriteMood.map((mood, index) => (
                          <span
                          key={index}
                          className="bg-gray-700 text-gray-300 px-2 py-1 rounded-full text-sm"
                          >
                          {mood}
                          </span>
                      ))}
                      </div>
                  </div>
                  )}

                  {/* お酒タグ */}
                  {selectedGroup.preferences.drinkingTags?.length > 0 && (
                  <div>
                      <h3 className="font-semibold mb-2">お酒の好み</h3>
                      <div className="flex flex-wrap gap-2">
                      {selectedGroup.preferences.drinkingTags.map((tag, index) => (
                          <span
                          key={index}
                          className="bg-pink-600 text-white px-2 py-1 rounded-full text-sm"
                          >
                          #{tag}
                          </span>
                      ))}
                      </div>
                  </div>
                  )}

                  {/* 趣味タグ */}
                  {selectedGroup.preferences.hobbyTags?.length > 0 && (
                  <div>
                      <h3 className="font-semibold mb-2">趣味</h3>
                      <div className="flex flex-wrap gap-2">
                      {selectedGroup.preferences.hobbyTags.map((tag, index) => (
                          <span
                          key={index}
                          className="bg-purple-600 text-white px-2 py-1 rounded-full text-sm"
                          >
                          #{tag}
                          </span>
                      ))}
                      </div>
                  </div>
                  )}
              </div>

              {/* アクションボタン */}
              {selectedGroup.createdBy && (
                  <div className="flex justify-center mt-4">
                  <Button
                      className={`${
                          auth?.currentUser && myGroupId && selectedGroup.invitedBy?.includes(myGroupId)
                          ? "bg-gray-600 hover:bg-gray-700"
                          : "neon-bg hover:bg-pink-700"
                      } text-white rounded-full`}
                      onClick={(e) => {
                        handleInviteGroup(selectedGroup, e)
                        setIsDialogOpen(false)
                      }}
                      disabled={!!(auth?.currentUser && myGroupId && selectedGroup.invitedBy?.includes(myGroupId))}
                  >
                      {auth?.currentUser && myGroupId && selectedGroup.invitedBy?.includes(myGroupId)
                          ? "招待済み"
                          : "Myグループでお誘いする"}
                  </Button>
                  </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {loading && (
        <div className="text-center py-4">
          <LoadingSpinner />
        </div>
      )}

      {hasMore && !loading && (
        <div className="text-center py-4">
          <Button
            variant="outline"
            onClick={loadMore}
            className="text-gray-300 hover:text-white"
          >
            もっと見る
          </Button>
        </div>
      )}
    </div>
  )
} 