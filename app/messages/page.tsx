"use client"

import { useEffect, useState } from "react"
import { collection, query, where, orderBy, getDocs, getDoc, doc, limit, Timestamp, writeBatch, serverTimestamp } from "firebase/firestore"
import { auth, db } from "@/app/firebase/config"
import { onAuthStateChanged } from "firebase/auth"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useUser } from "@/hooks/users"
import { Badge, Settings, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { fetchUserImage } from "@/hooks/fetch-image"
import { getStorage, ref, getDownloadURL, listAll } from "firebase/storage"
import IdentityVerification from "@/app/components/IdentityVerification"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface MessageRoom {
  id: string
  user_ids: string[]
  created_at: string
  messages: any[]
}

interface MessageDisplay extends MessageRoom {
  partnerInfo: {
    name: string
    photoURL: string
    age: number
    location: string
  } | null
}

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

export default function MessagesPage() {
  const [user, setUser] = useState<any>(null)
  const [messageRooms, setMessageRooms] = useState<MessageDisplay[]>([])
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState<any>(null)
  const router = useRouter()
  const [partnerIds, setPartnerIds] = useState<string[]>([])

  // 各パートナーIDに対して個別のuseUserフックを使用
  const partner1Data = useUser(partnerIds[0] || '')
  const partner2Data = useUser(partnerIds[1] || '')
  // 必要に応じて追加

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
        const roomsRef = collection(db, "message_rooms");
        
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
          const partnerId = roomData.user_ids.find(id => id !== user.uid);
          
          if (partnerId) {
            partnerIdsArray.push(partnerId);
          }
          
          // パートナー情報を取得
          let partnerName = "ユーザー";
          let partnerPhoto = "/placeholder.svg";
          
          if (partnerId) {
            const partnerDoc = await getDoc(doc(db, "users", partnerId));
            if (partnerDoc.exists()) {
              const partnerData = partnerDoc.data();
              partnerName = partnerData.name || "ユーザー";
              
              // ストレージからプロフィール画像を取得
              try {
                // プロフィール画像のフォルダパス
                const profileFolderPath = `profile-image/${partnerId}`;
                const profileFolderRef = ref(storage, profileFolderPath);
                
                // フォルダ内のファイル一覧を取得
                const fileList = await listAll(profileFolderRef);
                
                if (fileList.items.length > 0) {
                  // 最初の画像のURLを取得（または任意の選択ロジックを実装）
                  const firstImageRef = fileList.items[0];
                  partnerPhoto = await getDownloadURL(firstImageRef);
                  console.log(`Partner ${partnerId} photo URL:`, partnerPhoto);
                } else {
                  console.log(`No profile images found for partner ${partnerId}`);
                }
              } catch (error) {
                console.error("プロフィール画像の取得に失敗:", error);
                // エラーが発生した場合はデフォルト画像を使用
                partnerPhoto = "/placeholder.svg";
              }
            }
          }
          
          // 最後のメッセージを取得
          const messagesRef = collection(db, "message_rooms", roomDoc.id, "messages");
          const messagesQuery = query(messagesRef, orderBy("created_at", "desc"), limit(1));
          const messagesSnap = await getDocs(messagesQuery);
          
          console.log(`Room ${roomDoc.id} messages:`, messagesSnap.size); // メッセージ数をログ出力
          
          let lastMessage = null;
          if (!messagesSnap.empty) {
            const messageDoc = messagesSnap.docs[0];
            const messageData = messageDoc.data();
            console.log("Last message data:", messageData); // 最後のメッセージデータをログ出力
            
            lastMessage = {
              id: messageDoc.id,
              ...messageData,
              created_at: messageData.created_at?.toDate?.()
                ? messageData.created_at.toDate().toLocaleString('ja-JP')
                : new Date().toLocaleString('ja-JP') // 日付がない場合は現在時刻を使用
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
          
          roomsData.push({
            id: roomDoc.id,
            ...roomData,
            updated_at: roomData.updated_at?.toDate?.() 
              ? roomData.updated_at.toDate() 
              : new Date(0), // updated_atがない場合は古い日付を設定
            partner_id: partnerId,
            partner_name: partnerName,
            partner_photo: partnerPhoto,
            lastMessage: lastMessage,
            unreadCount: unreadCount,
            isNewRoom: isNewRoom
          });
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
            // 必要に応じて追加
            console.log(partnerData)
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

  if (!user) {
    return <div className="p-4">ログインが必要です</div>
  }

  if (loading) {
    return <div className="p-4">読み込み中...</div>
  }

  // 本人確認が完了していない場合
  if (!userData?.isIdentityVerified) {
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
          isVerified={userData?.isIdentityVerified}
          verificationStatus={userData?.verificationStatus}
        />
      </div>
    );
  }

  // 本人確認済みの場合は通常のメッセージ一覧を表示
  return (
    <div className="container mx-auto p-2">
      <h1 className="text-2xl font-bold mb-4">メッセージ</h1>
      
      {loading ? (
        <div className="text-center py-8">
          <p>読み込み中...</p>
        </div>
      ) : messageRooms.length > 0 ? (
        <div className="space-y-2">
          {messageRooms.map((room) => (
            <Link
              key={room.id}
              href={`/messages/${room.id}`}
              className="block p-1"
            >
              <div className="flex items-center gap-4">
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
                        {room.lastMessage.user_id === user?.uid ? "あなた: " : ""}
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
          ))}
        </div>
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
