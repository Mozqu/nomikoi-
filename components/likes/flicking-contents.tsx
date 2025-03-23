'use client'
import Flicking from "@egjs/react-flicking"
import ProfileCardSmall from "../profile/profile-card-small"
import { useUser } from "@/hooks/users"
import { fetchUserImage } from "@/hooks/fetch-image"
import { db } from "@/app/firebase/config"
import { collection, query, where, getDocs } from "firebase/firestore"
import { doc, serverTimestamp, setDoc } from "firebase/firestore"
import { Button } from "../ui/button"
import { useRouter } from "next/navigation"
import { auth } from "@/app/firebase/config"

interface Like {
    id: string
    target_id: string
    uid: string
    type: string
    created_at: Date
}

interface User {
    id: string
    name: string
    photoURL: string
    birthday: Date | null
    location: string
}
  

const LikeItem = ({ like, type }: { like: Like, type: string }) => {
    let userData: any
    let loading: boolean = false


    if (type === "liked") {
        userData = useUser(like.uid)
    } else if (type === "matched") {
        userData = useUser(like.target_id)
    } else if (type === "like") {
        userData = useUser(like.target_id)
    }

    console.log("userData", userData.userData)
  
    if (loading || !userData) {
      return <div className="w-[180px] h-[240px] bg-gray-200 animate-pulse rounded-xl" />
    }
  
    // userDataを正しい形式に変換
    const formattedUser: User = {
      id: userData.userData?.uid || '',
      name: userData.userData?.name || '',
      photoURL: fetchUserImage(userData.userData?.uid).imageUrl || '',
      birthday: userData.userData?.birthday || null,
      location: userData.userData?.location || ''
    }

  
    return <ProfileCardSmall user={formattedUser} />
  }
  

export default function FlickingContents({ likes, type }: { likes: any[], type: string }) {
    const router = useRouter()

    const handleClick = (userId: string) => {
        console.log("Navigating to user:", userId)
        router.push(`/users/${userId}`)
    }

    return (
        
        <div className={`panel w-full h-full overflow-y-auto z-10`}>
            {/* 各スライドを1ページ幅に固定 */}
            <div 
                className="flex flex-wrap w-full h-full" 
            >
                {likes.length > 0 ? likes.slice(0, 5).map((like) => (
                    <div key={like.id} className="p-2"
                        style={{
                            width: '50%',
                        }}
                    >
                        <LikeItem like={like} type={type} />
                        {/* メッセージボタン */}
                        {type === 'matched' && (
                            <div className="mt-2">
                            <Button
                                className="w-full bg-sky hover:bg-sky/90 text-white"
                                onClick={async (e) => {
                                e.stopPropagation()
                                try {
                                    // 既存のメッセージルームを検索
                                    const roomsRef = collection(db, "message_rooms")
                                    const userIds = [auth.currentUser?.uid, like.target_id].sort()
                                    const q = query(roomsRef, 
                                        where("user_ids", "==", userIds)
                                    )
                                    const querySnapshot = await getDocs(q)

                                    let roomId

                                    if (querySnapshot.empty) {
                                        // 既存のルームがない場合は新規作成
                                        const newRoomRef = doc(roomsRef)
                                        await setDoc(newRoomRef, {
                                            user_ids: userIds,
                                            created_at: serverTimestamp(),
                                            updated_at: serverTimestamp(),
                                            visitedUsers: {}
                                        })
                                        roomId = newRoomRef.id
                                    } else {
                                        // 既存のルームがある場合はそのIDを使用
                                        roomId = querySnapshot.docs[0].id
                                    }

                                    // ルームに遷移
                                    router.push(`/messages/${roomId}`)
                                } catch (error) {
                                    console.error("メッセージルームの作成に失敗:", error)
                                }
                                }}
                            >
                                メッセージを送る
                            </Button>
                            </div>
                        )}
                    </div>
                )) : (
                    <div className="w-full h-full">
                        <p>データがありません</p>
                    </div>
                )}
                
            </div>
        </div>
        
    )
}
