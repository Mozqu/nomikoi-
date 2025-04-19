"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { auth, db } from "@/app/firebase/config"
import { collection, query, orderBy, limit, getDocs, startAfter, QueryDocumentSnapshot, doc, getDoc, runTransaction, serverTimestamp, where } from "firebase/firestore"
import { LoadingSpinner } from "@/app/components/ui/loading-spinner"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { motion, AnimatePresence } from "framer-motion"

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
interface Event {
  id: string;
  title: string;
  createdBy: string;
  createdAt: any;
  updatedAt: any;
  description: string;
  memberNum: number;
  gender: string;
  invitedBy: string[];
  eventArea: string[];
  startedAt: string;
  creator?: User;
}

export default function EventList({ refreshTrigger }: { refreshTrigger?: number }) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCreateGroupDialogOpen, setIsCreateGroupDialogOpen] = useState(false)
  const [currentUserGender, setCurrentUserGender] = useState<string | null>(null)

  const fetchUserData = async (uid: string): Promise<User | null> => {
    try {
      if (!db) return null
      
      const userDoc = await getDoc(doc(db, "users", uid))
      if (userDoc.exists()) {
        return {
          id: userDoc.id,
          profileImage: userDoc.data()?.photos[0].url || "/default-profile.png",
          name: userDoc.data().name || "名無しユーザー",
          address: userDoc.data().profile.居住地 || "",
          age: calculateAge(userDoc.data().birthday) || 0,
          job: userDoc.data().profile.職種 || ""
        }
      }
      return null
    } catch (err) {
      console.error("ユーザー情報の取得に失敗しました:", err)
      return null
    }
  }

  // 現在のユーザーの性別を取得する関数
  const fetchCurrentUserGender = async () => {
    try {
      if (!auth) return null;
      const currentUser = auth.currentUser;
      if (!currentUser || !db) return null;

      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (userDoc.exists()) {
        const gender = userDoc.data().gender;
        setCurrentUserGender(gender);
        return gender;
      }
      return null;
    } catch (err) {
      console.error("ユーザーの性別の取得に失敗しました:", err);
      return null;
    }
  };

  const fetchEvents = async () => {
    try {
      if (!db) return;

      // 現在のユーザーの性別を取得
      const userGender = await fetchCurrentUserGender();
      if (!userGender) {
        setError("ユーザー情報の取得に失敗しました");
        return;
      }

      const eventsRef = collection(db, "events");
      const q = query(
        eventsRef,
        orderBy("createdAt", "desc"),
        limit(10)
      );

      const snapshot = await getDocs(q);
      const eventData = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const data = doc.data();
          const creator = await fetchUserData(data.createdBy);
          return {
            id: doc.id,
            ...data,
            creator
          };
        })
      ) as Event[];

      // 異なる性別のイベントのみをフィルタリング
      const filteredEvents = eventData.filter(event => event.gender !== userGender);

      setEvents(filteredEvents);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === 10);
    } catch (err) {
      console.error("イベントの取得に失敗しました:", err);
      setError("イベントの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!lastDoc || !hasMore || !db) return;

    try {
      setLoading(true);
      const eventsRef = collection(db, "events");
      const q = query(
        eventsRef,
        orderBy("createdAt", "desc"),
        startAfter(lastDoc),
        limit(10)
      );

      const snapshot = await getDocs(q);
      const newEventData = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const data = doc.data();
          const creator = await fetchUserData(data.createdBy);
          return {
            id: doc.id,
            ...data,
            creator
          };
        })
      ) as Event[];

      // 異なる性別のイベントのみをフィルタリング
      const filteredEvents = newEventData.filter(event => event.gender !== currentUserGender);

      setEvents(prev => [...prev, ...filteredEvents]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === 10);
    } catch (err) {
      console.error("追加のイベント取得に失敗しました:", err);
      setError("追加のイベント取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  // イベント参加処理
  const handleJoinEvent = async (event: Event) => {
    try {
      if (!auth?.currentUser || !db) {
        setError("ログインが必要です");
        return;
      }

      const currentUser = auth.currentUser;
      
      // イベントのinvitedByを更新
      const eventRef = doc(db, "events", event.id);
      
      // message_roomを作成
      const messageRoomRef = collection(db, "message_rooms");
      
      // トランザクションで処理
      await runTransaction(db, async (transaction) => {
        // イベントドキュメントを取得
        const eventDoc = await transaction.get(eventRef);
        if (!eventDoc.exists()) {
          throw new Error("イベントが存在しません");
        }

        // ユーザーのグループ情報を取得
        if (!db) {
          throw new Error("データベース接続が確立されていません");
        }

        // groupsコレクションからユーザーのグループを検索
        const groupsRef = collection(db, "groups");
        const q = query(groupsRef, where("createdBy", "==", currentUser.uid));
        const groupSnapshot = await getDocs(q);
        
        if (groupSnapshot.empty) {
          setIsCreateGroupDialogOpen(true);
          throw new Error("グループを作成してください");
        }

        const groupId = groupSnapshot.docs[0].id;

        // 既に参加済みかチェック
        const currentInvitedBy = eventDoc.data().invitedBy || [];
        if (currentInvitedBy.includes(currentUser.uid)) {
          throw new Error("既に参加済みです");
        }

        // invitedByを更新
        transaction.update(eventRef, {
          invitedBy: [...currentInvitedBy, currentUser.uid]
        });

        // message_roomを作成
        const messageRoomData = {
          type: "event",
          submitBy: groupId,  // グループIDを設定
          user_ids: [event.createdBy],
          eventId: event.id,
          createdAt: serverTimestamp(),
          verify: "processing",

        };

        transaction.set(doc(messageRoomRef), messageRoomData);
      });

      // イベントリストを更新
      setEvents(prevEvents => 
        prevEvents.map(e => 
          e.id === event.id 
            ? { ...e, invitedBy: [...(e.invitedBy || []), currentUser.uid] }
            : e
        )
      );

      // 成功メッセージ
      console.log("イベントに参加しました");
      
    } catch (err) {
      console.error("イベント参加に失敗しました:", err);
      setError(err instanceof Error ? err.message : "イベント参加に失敗しました");
    }
  };

  // グループ作成ダイアログを開く関数
  const openGroupCreateDialog = () => {
    setIsCreateGroupDialogOpen(false);
    // TODO: グループ作成ページへの遷移を実装
    window.location.href = "/mygroup/create";
  };

  useEffect(() => {
    fetchEvents()
  }, [refreshTrigger])

  if (error) {
    return <div className="text-red-500 text-center py-4">{error}</div>
  }

  // 日付をフォーマットする関数
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ja-JP', {
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      weekday: 'short'
    }).format(date);
  };

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {events.map((event) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-gray-800 rounded-lg shadow-lg flex cursor-pointer hover:bg-gray-700 transition-colors"
            onClick={() => {
              setSelectedEvent(event)
              setIsDialogOpen(true)
            }}
          >
            {/* createdByのユーザーのプロフィール画像を表示 */}
            <div className="relative w-24 h-24">
                <Image src={event.creator?.profileImage || "/default-profile.png"} alt="プロフィール画像" width={50} height={50} className="rounded-xl relative w-full h-full" style={{ objectFit: "cover" }}    />
                <span className="text-xs bg-blue-400 text-white px-2 py-1 rounded-full absolute top-[-10px] left-[-10px] whitespace-nowrap">
                    {formatDate(event.startedAt)}〜 {event.memberNum}人
                </span>

                <div className="absolute bottom-0 right-0 bg-black/50 rounded-lg p-1 w-full">
                    <div className="flex flex-wrap space-x-1">   
                        <span style={{ fontSize: "8px" }}>
                            {String(event.creator?.age || 0)}歳
                        </span>
                        <span style={{ fontSize: "8px" }}>
                            {event.creator?.address}
                        </span>
                        <span style={{ fontSize: "8px" }}>
                            {event.creator?.job}
                        </span>
                    </div>
                </div>
            </div>
            <div className="flex-1 p-2">


                <div className="flex justify-end gap-2">
                    {event.eventArea?.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {event.eventArea.map((area, index) => (
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

                <p className="text-gray-200 my-2">{event.title}</p>
                
                <div className="flex justify-end gap-2">
                    <button
                        className={`${
                          auth?.currentUser && event.invitedBy?.includes(auth.currentUser.uid)
                            ? "bg-gray-600 cursor-not-allowed"
                            : "bg-pink-600 hover:bg-pink-700"
                        } text-white text-xs px-2 py-1 rounded-full`}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleJoinEvent(event);
                        }}
                        disabled={Boolean(auth?.currentUser && event.invitedBy?.includes(auth.currentUser.uid))}
                    >
                        {auth?.currentUser && event.invitedBy?.includes(auth.currentUser.uid) 
                          ? "参加済み" 
                          : "イベントに参加する"}
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
            <DialogTitle>イベント詳細</DialogTitle>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-4">
              <div className="flex justify-between items-center relative">
                {/* プロフィール情報 */}
                <div className="relative w-24 h-24">
                    <Image 
                      src={selectedEvent.creator?.profileImage || "/default-profile.png"} 
                      alt="プロフィール画像" 
                      width={50} 
                      height={50} 
                      className="rounded-xl relative w-full h-full" 
                      style={{ objectFit: "cover" }}
                    />
                    <span className="text-sm bg-blue-400 text-white px-2 py-1 rounded-full absolute top-[-10px] left-[-10px] whitespace-nowrap">
                        {formatDate(selectedEvent.startedAt)}〜 {selectedEvent.memberNum}人
                    </span>

                    <div className="absolute bottom-0 right-0 bg-black/50 rounded-lg p-1 w-full">
                    <div className="flex flex-wrap space-x-1">   
                        <span style={{ fontSize: "8px" }}>
                            {String(selectedEvent.creator?.age || 0)}歳
                        </span>
                        <span style={{ fontSize: "8px" }}>
                            {selectedEvent.creator?.address}
                        </span>
                        <span style={{ fontSize: "8px" }}>
                            {selectedEvent.creator?.job}
                        </span>
                    </div>
                    </div>
                </div>

                {/* エリア */}
                {selectedEvent.eventArea?.length > 0 && (
                    
                    <div className="flex flex-wrap gap-2 absolute top-[-10px] right-[-10px]">
                        {selectedEvent.eventArea.map((area, index) => (
                            <span
                                key={index}
                                className="bg-gray-700 text-gray-300 px-2 py-1 rounded-full text-sm"
                            >
                                {area}
                            </span>
                        ))}
                    </div>
                    
                )}

                {/* イベント基本情報 */}
                <div className="flex-1 ml-4 relative">



                    <p className="text-gray-300">{selectedEvent.title}</p>
                </div>
              </div>

              <div className="flex justify-between items-center">  
                <p className="text-gray-300">{selectedEvent.description}</p>
              </div>

              {/* アクションボタン */}
              {selectedEvent.createdBy && (
                  <div className="flex justify-center mt-4">
                  <Button
                      className="neon-bg hover:bg-pink-700 text-white rounded-full"
                      onClick={() => {
                      console.log("イベントに参加する")
                      setIsDialogOpen(false)
                      }}
                  >
                      イベントに参加する
                  </Button>
                  </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* グループ作成を促すダイアログ */}
      <Dialog open={isCreateGroupDialogOpen} onOpenChange={setIsCreateGroupDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-gray-900 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">グループの作成が必要です</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-center mb-4">他のグループとマッチングするには、まずあなたのグループを作成する必要があります。</p>
            <p className="text-center text-sm text-gray-400 mb-6">グループを作成して、素敵な出会いを見つけましょう！</p>
            <div className="flex justify-center gap-4">
              <Button
                onClick={openGroupCreateDialog}
                className="neon-bg hover:bg-pink-700 text-white px-8"
              >
                グループを作成する
              </Button>
              <Button
                onClick={() => setIsCreateGroupDialogOpen(false)}
                variant="outline"
                className="text-gray-400 hover:text-white"
              >
                キャンセル
              </Button>
            </div>
          </div>
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