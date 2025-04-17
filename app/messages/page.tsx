"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import { collection, query, where, orderBy, getDocs, getDoc, doc, limit, Timestamp, writeBatch, serverTimestamp, updateDoc, addDoc } from "firebase/firestore"
import { auth, db } from "@/app/firebase/config"
import { onAuthStateChanged } from "firebase/auth"
import { useRouter, useParams } from "next/navigation"
import Image from "next/image"
import { useUser } from "@/hooks/users"
import { Badge, Settings, ShieldAlert, CheckCircle2, Loader2, AlertCircle, XCircle, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { fetchUserImage } from "@/hooks/fetch-image"
import { getStorage, ref, getDownloadURL, listAll } from "firebase/storage"
import IdentityVerification from "@/app/components/IdentityVerification"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Flicking from "@egjs/react-flicking"
import { create } from "domain"

interface MessageRoom {
  id: string
  user_ids: string[]
  created_at: string
  messages: any[]
  updated_at: Date
  partner_id: string
  partner_name: string
  partner_photo: string
  type?: 'group' | 'event'  // タイプを追加
  lastMessage: {
    id: string
    text: string
    user_id: string
    created_at: string
  } | null
  unreadCount: number
  isNewRoom: boolean
}

interface MessageDisplay extends MessageRoom {
  partnerInfo: {
    name: string
    photoURL: string
    age: number
    location: string
  } | null
  permission?: boolean  // 追加：booleanに型を修正
  groupId?: string
  submitBy?: string
  rejected?: boolean
}

// メッセージルームの種類を定義
type MessageRoomType = 'normal' | 'group' | 'event'

const formatRelativeTime = (dateString: string) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString; // パースできない場合は元の文字列を返す
    }

    const now = new Date();
    const diffInMilliseconds = now.getTime() - date.getTime();
    const diffInHours = diffInMilliseconds / (1000 * 60 * 60);
    const diffInDays = diffInHours / 24;
    const diffInWeeks = diffInDays / 7;
    const diffInMonths = diffInDays / 30;
    const diffInYears = diffInDays / 365;

    if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return hours === 0 ? 'たった今' : `${hours}時間前`;
    } else if (diffInDays < 7) {
      const days = Math.floor(diffInDays);
      return `${days}日前`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInWeeks);
      return `${weeks}週間前`;
    } else if (diffInDays < 365) {
      const months = Math.floor(diffInMonths);
      return `${months}ヶ月前`;
    } else {
      const years = Math.floor(diffInYears);
      return `${years}年前`;
    }
  } catch (error) {
    console.error('Date formatting error:', error);
    return dateString; // エラーが発生した場合は元の文字列を返す
  }
};

const calculateAge = (birthday: Timestamp | null | any): number | null => {
    if (!birthday) return null
    
    // Timestampオブジェクトかどうかをチェック
    if (typeof birthday.toDate !== 'function') {
        // 文字列の場合はDateオブジェクトに変換
        if (typeof birthday === 'string') {
        const date = new Date(birthday)
        if (isNaN(date.getTime())) return null
        const today = new Date()
        let age = today.getFullYear() - date.getFullYear()
        const m = today.getMonth() - date.getMonth()
        if (m < 0 || (m === 0 && today.getDate() < date.getDate())) {
            age--
        }
        return age
        }
        return null
    }
    
    const birthDate = birthday.toDate()
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--
    }
    return age
}

// メッセージルームを種類ごとに分類する関数
const categorizeMessageRooms = (rooms: MessageDisplay[]): Record<MessageRoomType, MessageDisplay[]> => {
  return {
    normal: rooms.filter(room => !room.type || room.type === 'normal'),
    group: rooms.filter(room => room.type === 'group'),
    event: rooms.filter(room => room.type === 'event')
  }
}

// 通常メッセージ用のコンポーネント
const NormalMessageItem = ({ room, userId }: { room: MessageDisplay; userId: string }) => {
  return (
    <Link href={`/messages/${room.id}`} className="block">
      <div className="flex items-center gap-4 bg-transparent shadow-sm hover:shadow-md transition-shadow">
        <div className="relative w-16 h-16">
          <Image
            src={room.partner_photo || "/placeholder.svg"}
            alt={room.partner_name || "ユーザー"}
            fill
            className="rounded-xl object-cover"
          />
          {room.isNewRoom && (
            <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold rounded-full px-2 py-1">
              NEW
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium">{room.partner_name || "ユーザー"}</h3>
          <p className="text-sm text-gray-400 truncate">
            {room.lastMessage ? (
              <>
                {room.lastMessage.user_id === userId ? "あなた: " : ""}
                {room.lastMessage.text}
              </>
            ) : "メッセージはありません"}
          </p>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-xs text-gray-500">
            {room.lastMessage?.created_at ? formatRelativeTime(room.lastMessage.created_at) : ""}
          </div>
          {room.unreadCount > 0 && (
            <div className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center mt-1">
              {room.unreadCount}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

// グループメッセージ用のコンポーネント
const GroupMessageItem = ({ room, userId }: { room: MessageDisplay; userId: string }) => {
  const [groupData, setGroupData] = useState<any>(null)
  const [submitUserData, setsubmitUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      console.log("Room data:", room)
      if (!room.groupId) {
        // groupIdが存在しない場合、roomのidをgroupIdとして試してみる
        try {
          const groupDoc = await getDoc(doc(db!, "groups", room.id))
          if (groupDoc.exists()) {
            const data = groupDoc.data()
            setGroupData(data)
            console.log("Group data found using room.id:", data)

            // メッセージルームを更新
            const roomRef = doc(db!, "message_rooms", room.id)
            await updateDoc(roomRef, {
              groupId: room.id,
              submitBy: data.submitBy
            })

            // グループ申請者のデータを取得
            if (data.submitBy) {
              const userDoc = await getDoc(doc(db!, "users", data.submitBy))
              if (userDoc.exists()) {
                setsubmitUserData(userDoc.data())
                console.log("submitUser data:", userDoc.data())
              }
            }
          } else {
            console.error("Group document does not exist:", room.id)
          }
        } catch (error) {
          console.error("データの取得に失敗:", error)
        } finally {
          setLoading(false)
        }
        return
      }

      try {
        // 通常のグループデータ取得処理
        if (room.submitBy) {
          const userDoc = await getDoc(doc(db!, "users", room.submitBy))
          if (userDoc.exists()) {
            const userData = userDoc.data()
            setsubmitUserData(userData)
            console.log("submitUser data:", userData)

            // ユーザーデータを取得した後にグループを検索
            const groupsRef = collection(db!, "groups")
            const q = query(groupsRef, where("createdBy", "==", userData.uid))
            const groupsSnapshot = await getDocs(q)

            if (!groupsSnapshot.empty) {
              const groupDoc = groupsSnapshot.docs[0] // 最初に見つかったグループを使用
              const data = groupDoc.data()
              setGroupData(data)
              console.log("Group data:", data)
            }
          }
        }

        const groupDoc = await getDoc(doc(db!, "groups", room.groupId))
        if (groupDoc.exists()) {
          const data = groupDoc.data()
          setGroupData(data)
          console.log("Group data:", data)


        } else {
          console.error("Group document does not exist:", room.groupId)
        }
      } catch (error) {
        console.error("データの取得に失敗:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [room.id, room.groupId])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="animate-spin" />
      </div>
    )
  }

  console.log("room", room)
  
  return (
    <Link href={`/messages/${room.id}`} className="block p-1">
      <div className="bg-gray-800 rounded-lg shadow-lg flex cursor-pointer hover:bg-gray-700 transition-colors">
        <div className="relative w-24 h-24">
          <Image
            src={submitUserData?.photos[0].url || submitUserData?.photoURL || "/default-profile.png"}
            alt={submitUserData?.name || "グループ"}
            fill
            className="rounded-xl object-cover"
          />

          {submitUserData && (
            <div className="absolute bottom-0 right-0 bg-black/50 rounded-lg p-1 w-full">
              <div className="flex flex-wrap space-x-1">   
                <span style={{ fontSize: "8px" }}>
                  {calculateAge(submitUserData.birthday) || "-"}歳
                </span>
                <span style={{ fontSize: "8px" }}>
                  {submitUserData.profile.居住地}
                </span>
                <span style={{ fontSize: "8px" }}>
                  {submitUserData.profile.職種}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 p-2">
          <div className="flex justify-between items-start">
            <h3 className="font-medium text-gray-200">{submitUserData?.name}</h3>
            <div className="text-xs text-gray-400">
              {room.lastMessage?.created_at ? formatRelativeTime(room.lastMessage.created_at) : ""}
            </div>
          </div>



          <p className="text-gray-300 text-sm mt-2 mb-3 truncate">
            {(room.rejected ? <span>お誘いを拒否しています</span> : 
              (!room.permission ? <span className="text-pink-400">新しいお誘いが来ました</span> : room.lastMessage ? (
                <>
                  {room.lastMessage.user_id === userId ? "あなた: " : ""}
                  {room.lastMessage.text} 
                </>
              ) : "メッセージはありません")
            )}
          </p>

          <div className="flex justify-end items-center gap-2">
            {room.unreadCount > 0 && (
              <div className="bg-pink-600 text-white text-xs rounded-full px-2 py-1">
                {room.unreadCount}件の未読
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

// イベントメッセージ用のコンポーネント
const EventMessageItem = ({ room, userId }: { room: MessageDisplay; userId: string }) => {
  return (
    <Link href={`/messages/${room.id}`} className="block p-1">
      <div className="flex items-center gap-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border border-orange-100">
        <div className="relative w-16 h-16">
          <Image
            src={room.partner_photo || "/placeholder.svg"}
            alt={room.partner_name || "イベント"}
            fill
            className="rounded-xl object-cover"
          />
          <div className="absolute -bottom-2 -right-2 bg-orange-500 text-white text-xs font-bold rounded-full px-2 py-1">
            イベント
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-orange-900">{room.partner_name || "イベント"}</h3>
          <p className="text-sm text-orange-600/70 truncate">
            {room.lastMessage ? (
              <>
                {room.lastMessage.user_id === userId ? "あなた: " : ""}
                {room.lastMessage.text}
              </>
            ) : "メッセージはありません"}
          </p>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-xs text-orange-500">
            {room.lastMessage?.created_at ? formatRelativeTime(room.lastMessage.created_at) : ""}
          </div>
          {room.unreadCount > 0 && (
            <div className="bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center mt-1">
              {room.unreadCount}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

// メッセージルームのセクション表示用のコンポーネント
const MessageRoomSection = ({ 
  title, 
  rooms, 
  userId,
  type 
}: { 
  title: string
  rooms: MessageDisplay[]
  userId: string
  type: 'normal' | 'group' | 'event'
}) => {
  // 指定されたタイプのルームのみをフィルタリング
  const filteredRooms = type === 'normal' 
    ? rooms.filter(room => !room.type || room.type === 'normal')
    : rooms.filter(room => room.type === type)
  
  if (filteredRooms.length === 0) {
    return (
      <div className="text-center py-8 border rounded-lg">
        <p className="text-gray-500">{title}はありません</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="font-bold text-lg mb-4">{title}</h2>
      {filteredRooms.map((room) => {
        switch (type) {
          case 'normal':
            return <NormalMessageItem key={room.id} room={room} userId={userId} />
          case 'group':
            return <GroupMessageItem key={room.id} room={room} userId={userId} />
          case 'event':
            return <EventMessageItem key={room.id} room={room} userId={userId} />
        }
      })}
    </div>
  )
}

// タブ用のコンポーネント
const MessageTabs = ({ 
  activeTab, 
  onTabChange,
  counts,
  flickingRef
}: { 
  activeTab: MessageRoomType
  onTabChange: (tab: MessageRoomType) => void
  counts: Record<MessageRoomType, number>
  flickingRef: React.RefObject<Flicking>
}) => {
  const handleTabChange = (tab: MessageRoomType) => {
    onTabChange(tab);
    if (flickingRef.current) {
      const index = tab === 'normal' ? 0 : tab === 'group' ? 1 : 2;
      flickingRef.current.moveTo(index);
    }
  };

  return (
    <div className="flex space-x-2 mb-4 border-b">
      <button
        className={`w-[33%] px-4 py-2 ${activeTab === 'normal' ? 'border-b-2 border-neon text-neon' : 'text-gray-500'}`}
        onClick={() => handleTabChange('normal')}
      >
        メッセージ
      </button>
      <button
        className={`w-[33%] px-4 py-2 ${activeTab === 'group' ? 'border-b-2 border-neon text-neon' : 'text-gray-500'}`}
        onClick={() => handleTabChange('group')}
      >
        グループ
      </button>
      <button
        className={`w-[33%] px-4 py-2 ${activeTab === 'event' ? 'border-b-2 border-neon text-neon' : 'text-gray-500'}`}
        onClick={() => handleTabChange('event')}
      >
        イベント
      </button>
    </div>
  )
}

export default function MessagesPage() {
  const [user, setUser] = useState<any>(null)
  const [messageRooms, setMessageRooms] = useState<MessageDisplay[]>([])
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState<any>(null)
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const [partnerIds, setPartnerIds] = useState<string[]>([])
  const flickingRef = useRef<Flicking>(null)
  // 各パートナーIDに対して個別のuseUserフックを使用
  const partner1Data = useUser(partnerIds[0] || '')
  const partner2Data = useUser(partnerIds[1] || '')
  const [activeTab, setActiveTab] = useState<MessageRoomType>('normal')

  // メッセージルームの数を計算
  const roomCounts = useMemo(() => {
    const categorized = categorizeMessageRooms(messageRooms)
    return {
      normal: categorized.normal.length,
      group: categorized.group.length,
      event: categorized.event.length
    }
  }, [messageRooms])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const fetchRooms = async () => {
      if (!user) return;
      console.log("fetchRooms", user.uid);
      try {
        setLoading(true);
        const roomsRef = collection(db!, "message_rooms");
        
        // updated_atでソートするクエリを作成
        const q = query(
          roomsRef, 
          where("user_ids", "array-contains", user.uid),
          orderBy("updated_at", "desc") // 降順（最新順）でソート
        );
        
        const roomsSnap = await getDocs(q);
        
        console.log("Found rooms:", roomsSnap.size);
        
        if (roomsSnap.empty) {
          console.log("No message rooms found");
          setMessageRooms([]);
          setLoading(false);
          return;
        }
        
        const roomsData = [];
        const partnerIdsArray: string[] = [];
        const storage = getStorage();
        
        for (const roomDoc of roomsSnap.docs) {
          const roomData = roomDoc.data();
          const partnerId = roomData.user_ids.find((id: string) => id !== user.uid);
          
          if (partnerId) {
            partnerIdsArray.push(partnerId);
          }
          
          // パートナー情報を取得
          let partnerName = "ユーザー";
          let partnerPhoto = "/placeholder.svg";
          let partnerInfo = null;
          
          if (partnerId) {
            const partnerDoc = await getDoc(doc(db!, "users", partnerId));
            if (partnerDoc.exists()) {
              const partnerData = partnerDoc.data();
              partnerName = partnerData.name || "ユーザー";
              partnerInfo = {
                name: partnerData.name || "",
                photoURL: partnerData.photoURL || "/placeholder.svg",
                age: calculateAge(partnerData.birthday) || 0,
                location: partnerData.location || ""
              };
              
              // ストレージからプロフィール画像を取得
              try {
                const profileFolderPath = `profile-image/${partnerId}`;
                const profileFolderRef = ref(storage, profileFolderPath);
                const fileList = await listAll(profileFolderRef);
                
                if (fileList.items.length > 0) {
                  const firstImageRef = fileList.items[0];
                  partnerPhoto = await getDownloadURL(firstImageRef);
                }
              } catch (error) {
                console.error("プロフィール画像の取得に失敗:", error);
                partnerPhoto = "/placeholder.svg";
              }
            }
          }
          
          // 最後のメッセージを取得
          const messagesRef = collection(db!, "message_rooms", roomDoc.id, "messages");
          const messagesQuery = query(messagesRef, orderBy("created_at", "desc"), limit(1));
          const messagesSnap = await getDocs(messagesQuery);
          
          let lastMessage = null;
          if (!messagesSnap.empty) {
            const messageDoc = messagesSnap.docs[0];
            const messageData = messageDoc.data();
            lastMessage = {
              id: messageDoc.id,
              text: messageData.text || "",
              user_id: messageData.user_id || "",
              created_at: messageData.created_at?.toDate?.()
                ? messageData.created_at.toDate().toLocaleString('ja-JP')
                : new Date().toLocaleString('ja-JP')
            };
          }
          
          // 未読メッセージ数を取得
          const unreadQuery = query(
            messagesRef,
            where("user_id", "!=", user.uid),
            where("read", "==", false)
          );
          const unreadSnap = await getDocs(unreadQuery);
          const unreadCount = unreadSnap.size;
          
          // 訪問履歴を確認
          const visitedUsers = roomData.visitedUsers || {};
          const isNewRoom = !visitedUsers[user.uid];
          
          const messageRoom: MessageDisplay = {
            id: roomDoc.id,
            user_ids: roomData.user_ids || [],
            created_at: roomData.created_at?.toDate?.()
              ? roomData.created_at.toDate().toLocaleString('ja-JP')
              : new Date().toLocaleString('ja-JP'),
            messages: [],
            updated_at: roomData.updated_at?.toDate?.() 
              ? roomData.updated_at.toDate() 
              : new Date(),
            partner_id: partnerId || "",
            partner_name: partnerName,
            partner_photo: partnerPhoto,
            type: roomData.type,
            lastMessage,
            unreadCount,
            isNewRoom,
            partnerInfo,
            rejected: roomData.rejected || false,
            ...(roomData.type === 'group' && {
              groupId: roomData.groupId,
              submitBy: roomData.submitBy,
              permission: roomData.permission
            })
          };
          
          roomsData.push(messageRoom);
        }
        
        // 念のため、JavaScriptでもソート
        roomsData.sort((a, b) => {
          return b.updated_at.getTime() - a.updated_at.getTime();
        });
        
        console.log("Processed rooms data:", roomsData);
        setPartnerIds(partnerIdsArray);
        setMessageRooms(roomsData);
      } catch (error) {
        console.error("メッセージルームの取得に失敗:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchRooms();
    }
  }, [user]);

  // パートナー情報が取得できたら、messageRoomsを更新
  useEffect(() => {
    if (user) {
        const updatedRooms = messageRooms.map(room => {
            const partnerId = room.user_ids.find(id => id !== user.uid) || ''
            let partnerData = null

            // パートナーデータを探す
            if (partnerId === partnerIds[0]) {
                partnerData = partner1Data.userData
            } else if (partnerId === partnerIds[1]) {
                partnerData = partner2Data.userData
            }

            // グループメッセージの場合
            if (room.type === 'group') {
                // groupIdはメッセージルームのデータに含まれているはず
                const groupId = room.groupId // メッセージルームのデータに含まれているgroupIdを使用
                const submitBy = room.submitBy // メッセージルームのデータに含まれているsubmitByを使用
                
                if (!groupId) {
                    console.error('Group message room without groupId:', room)
                }
                
                return {
                    ...room,
                    groupId,
                    submitBy,
                    partnerInfo: partnerData ? {
                        name: partnerData.name || '',
                        photoURL: partnerData.photoURL || '/placeholder.svg',
                        age: calculateAge(partnerData.birthday) || 0,
                        location: partnerData.location || ''
                    } : null
                }
            }

            // 通常のメッセージの場合
            return {
                ...room,
                partnerInfo: partnerData ? {
                    name: partnerData.name || '',
                    photoURL: partnerData.photoURL || '/placeholder.svg',
                    age: calculateAge(partnerData.birthday) || 0,
                    location: partnerData.location || ''
                } : null
            }
        })

        if (JSON.stringify(updatedRooms) !== JSON.stringify(messageRooms)) {
            setMessageRooms(updatedRooms)
        }
    }
  }, [user, partner1Data, partner2Data, messageRooms, partnerIds])

  // 一度だけ実行する初期化処理
  useEffect(() => {
    const initializeUpdatedAt = async () => {
      if (!user) return;
      
      try {
        const roomsRef = collection(db, "message_rooms");
        const q = query(
          roomsRef, 
          where("user_ids", "array-contains", user.uid)
        );
        const roomsSnap = await getDocs(q);
        
        const batch = writeBatch(db);
        let updateCount = 0;
        
        for (const roomDoc of roomsSnap.docs) {
          const roomData = roomDoc.data();
          
          // updated_atフィールドがない場合のみ更新
          if (!roomData.updated_at) {
            // 最後のメッセージを取得して、その日時をupdated_atに設定
            const messagesRef = collection(db, "message_rooms", roomDoc.id, "messages");
            const messagesQuery = query(messagesRef, orderBy("created_at", "desc"), limit(1));
            const messagesSnap = await getDocs(messagesQuery);
            
            if (!messagesSnap.empty) {
              const lastMessage = messagesSnap.docs[0].data();
              batch.update(roomDoc.ref, { 
                updated_at: lastMessage.created_at 
              });
            } else {
              // メッセージがない場合はルームの作成日時を使用
              batch.update(roomDoc.ref, { 
                updated_at: roomData.created_at || serverTimestamp() 
              });
            }
            
            updateCount++;
          }
        }
        
        if (updateCount > 0) {
          await batch.commit();
          console.log(`${updateCount}件のメッセージルームのupdated_atを初期化しました`);
        }
      } catch (error) {
        console.error("updated_atの初期化に失敗:", error);
      }
    };
    
    if (user) {
      initializeUpdatedAt();
    }
  }, [user]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      } catch (error) {
        console.error("ユーザーデータの取得に失敗:", error);
      }
    };

    if (user) {
      fetchUserData();
    }
  }, [user]);


  // グループチャットの許可を更新
  const handleAcceptChat = async () => {
    if (!id || !room?.submitBy) return
    try {
      const roomRef = doc(db!, "message_rooms", id)
      const roomDoc = await getDoc(roomRef)
      
      if (roomDoc.exists()) {
        const roomData = roomDoc.data()
        const currentUserIds = roomData.user_ids || []
        const updatedUserIds = currentUserIds.includes(room.submitBy) 
          ? currentUserIds 
          : [...currentUserIds, room.submitBy]
        
        await updateDoc(roomRef, {
          permission: true,
          user_ids: updatedUserIds
        })

        // 承認メッセージを送信
        const messagesRef = collection(db!, "message_rooms", id, "messages")
        await addDoc(messagesRef, {
          text: "チャットを解放しました",
          created_at: serverTimestamp(),
          user_id: user.uid,
          user_name: userData?.name || "ユーザー",
          user_photo: userData?.photoURL || "/placeholder.svg",
          read: false
        })
        
        console.log("チャットを承認し、ユーザーを追加しました")
      }
    } catch (error) {
      console.error("チャットの許可に失敗:", error)
    }
  }

  const handleRejectChat = () => {
    router.push("/messages")
  }

  if (!user) {
    return <div className="p-4">ログインが必要です</div>
  }

  if (loading) {
    return <div className="p-4">読み込み中...</div>
  }

  // 本人確認が完了していない場合
  if (!userData?.stripe?.isIdentityVerified) {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-yellow-500" />
              <CardTitle>本人確認が必要です</CardTitle>
            </div>
            <CardDescription>
              安全なコミュニティを維持するため、メッセージの送受信には本人確認が必要です。
              以下の手順で本人確認を完了してください。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-medium text-yellow-800 mb-2">本人確認が必要な理由</h3>
                <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                  <li>なりすまし防止のため</li>
                  <li>安全なコミュニケーションの確保</li>
                  <li>不正利用の防止</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <IdentityVerification 
          userId={user.uid}
          isVerified={userData?.stripe?.isIdentityVerified}
          verificationStatus={userData?.stripe?.verificationStatus}
        />
      </div>
    );
  }

  // 本人確認済みの場合は通常のメッセージ一覧を表示
  return (
    <div className="container mx-auto p-2 min-h-full">
      <h1 className="text-2xl font-bold mb-4">メッセージ</h1>

      {loading ? (
        <div className="text-center py-8">
          <p>読み込み中...</p>
        </div>
      ) : messageRooms.length > 0 ? (
        <>
          <MessageTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            counts={roomCounts}
            flickingRef={flickingRef}
          />

          <Flicking
            ref={flickingRef}
            align="prev"
            defaultIndex={0}
            bound={true}
            duration={300}
            threshold={40}
            circular={false}
            onChanged={(e) => {
              const index = e.index;
              if (index === 0) setActiveTab('normal');
              else if (index === 1) setActiveTab('group');
              else if (index === 2) setActiveTab('event');
            }}
            className="w-full"
          >
            {/* 通常メッセージ */}
            <div className="w-full panel min-h-full">
              <MessageRoomSection
                title="通常メッセージ"
                rooms={categorizeMessageRooms(messageRooms).normal}
                userId={user.uid}
                type="normal"
              />
            </div>

            {/* グループメッセージ */}
            <div className="w-full panel min-h-full">
              <MessageRoomSection
                title="グループメッセージ"
                rooms={categorizeMessageRooms(messageRooms).group}
                userId={user.uid}
                type="group"
              />
            </div>

            {/* イベントメッセージ */}
            <div className="w-full panel min-h-full">
              <MessageRoomSection
                title="イベントメッセージ"
                rooms={categorizeMessageRooms(messageRooms).event}
                userId={user.uid}
                type="event"
              />
            </div>
          </Flicking>

          <style jsx global>{`
            .panel {
              width: 100%;
              flex: 0 0 100%;
            }
            .flicking-viewport {
              width: 100%;
              overflow: hidden;
            }
            .flicking-camera {
              display: flex;
              width: 100%;
            }
          `}</style>
        </>
      ) : (
        <div className="text-center py-8 border rounded-lg">
          <p className="mb-4">メッセージはまだありません</p>
          <Button className="bg-neon text-white" onClick={() => router.push("/home")}>
            ユーザーを探す
          </Button>
        </div>
      )}
    </div>
  )
}
