"use client"

import { useEffect, useState, useRef } from "react"
import { collection, getDocs, orderBy, query, where, Timestamp } from "firebase/firestore"
import { auth, db } from "@/app/firebase/config"
import { onAuthStateChanged } from "firebase/auth"
import { fetchUserImage } from "@/hooks/fetch-image"
import Image from "next/image"
import { useUser } from "@/hooks/users"
import ProfileCardSmall from "@/components/profile/profile-card-small"
import { Button } from "@/components/ui/button"
import Flicking, { WillChangeEvent } from "@egjs/react-flicking"
import FlickingContents from "@/components/likes/flicking-contents"
import "@egjs/react-flicking/dist/flicking.css";


interface Like {
  id: string
  target_id: string
  uid: string
  type: string
  created_at: Timestamp | Date
}

interface User {
  id: string
  name: string
  photoURL: string
  birthday: Timestamp | null
  location: string
}

// いいねの各アイテムのコンポーネント
const LikeItem = ({ like }: { like: Like }) => {
  const { userData, loading } = useUser(like.uid)

  if (loading || !userData) {
    return <div className="w-[180px] h-[240px] bg-gray-200 animate-pulse rounded-xl" />
  }

  // userDataを正しい形式に変換
  const formattedUser: User = {
    id: like.uid,
    name: userData.name || '',
    photoURL: userData.photoURL || '',
    birthday: userData.birthday || null,
    location: userData.location || ''
  }

  return <ProfileCardSmall user={formattedUser} />
}



export default function InterestedPage() {
    const [imageIndex, setImageIndex] = useState(1);

    const [user, setUser] = useState<any>(null)
    const [likes, setLikes] = useState<Like[]>([])
    const [liked, setLiked] = useState<Like[]>([])
    const [matched, setMatched] = useState<Like[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('received')
    const [isExpanded, setIsExpanded] = useState(false)
    const flickingRef = useRef<Flicking>(null)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth!, (user) => {
        setUser(user)
        console.log("Current user:", user?.uid)
        })

        return () => unsubscribe()
    }, [])

  const fetchLikes = async () => {

    if (!user) return
        try {
            const likesRef = collection(db!, "user_likes")
            // すべてのいいねを取得
            const querySnapshot = await getDocs(likesRef)
            const allLikes = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Like[]  // Likeインターフェースとして型付け

            console.log("allLikes", allLikes)

            // 自分が送ったいいね
            const sentLikes = allLikes.filter(like => like.uid === user.uid)
            // 自分が受け取ったいいね 
            const receivedLikes = allLikes.filter(like => like.target_id === user.uid)

            // マッチしているいいねを抽出
            const matchedLikes = sentLikes.filter(sent => 
                receivedLikes.some(received => received.uid === sent.target_id)
            )

            // マッチしていないいいねを抽出
            const unmatchedSentLikes = sentLikes.filter(sent =>
                !matchedLikes.some(matched => 
                    matched.target_id === sent.target_id && matched.uid === sent.uid
                )
            )
            const unmatchedReceivedLikes = receivedLikes.filter(received =>
                !matchedLikes.some(matched => 
                    matched.uid === received.uid && matched.target_id === received.target_id
                )
            )

            setLikes(unmatchedSentLikes)
            setLiked(unmatchedReceivedLikes)
            setMatched(matchedLikes)

        } catch (error) {
            console.error("いいね一覧の取得に失敗:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (user) {
            fetchLikes()
        }
    }, [user])

    if (!user) {
        return <div className="p-4">ログインが必要です</div>
    }

    if (loading) {
        return <div className="p-4">読み込み中...</div>
    }


    const handleImageIndex = (index: number) => {
        setImageIndex(index);
        if (index === 0) {
            setActiveTab('liked')
        } else if (index === 1) {
            setActiveTab('matched')
        } else if (index === 2) {
            setActiveTab('like')
        }
        
        // moveToを呼び出さない
        console.log(activeTab, imageIndex)
    }

    // タブクリック用の関数を修正
    const handleTabClick = (index: number) => {
        // 状態の更新
        setImageIndex(index);
        if (index === 0) {
            setActiveTab('liked')
        } else if (index === 1) {
            setActiveTab('matched')
        } else if (index === 2) {
            setActiveTab('like')
        }
        
        // moveToのみを呼び出し
        if (flickingRef.current) {
            try {
                flickingRef.current.moveTo(index, 300)
            } catch (error) {
                console.log("移動エラー:", error)
            }
        }
    }

    return (
        <div className="p-2 overflow-hidden flex-1 flex flex-col">
            <div className="flex flex-row justify-center my-4"
                style={{
                    borderBottom: "1px solid rgba(255, 255, 255, 0.4)"
                }}
            >
                <div className="w-1/3 text-center mx-2 sky-text"
                    style={{
                        borderBottom: activeTab === 'liked' ? '1px solid #fff' : 'none'
                    }}
                    onClick={() => handleTabClick(0)}
                >
                    liked
                </div>
                <div className="w-1/3 text-center mx-2 neon-text"
                    style={{
                        borderBottom: activeTab === 'matched' ? '1px solid #fff' : 'none'
                    }}
                    onClick={() => handleTabClick(1)}
                >
                    matched
                </div>
                <div className="w-1/3 text-center mx-2 pink-text"
                    style={{
                        borderBottom: activeTab === 'like' ? '1px solid #fff' : 'none'
                    }}
                    onClick={() => handleTabClick(2)}
                >
                    like
                </div>
            </div>

            <div className="flex-1">
                <Flicking
                    ref={flickingRef}
                    viewportTag="div"
                    cameraTag="div"
                    cameraClass=""
                    renderOnSameKey={false}
                    align="prev"
                    defaultIndex={1}
                    onWillChange={(e: WillChangeEvent) => {
                        // インデックスの更新のみ行い、moveToは呼び出さない
                        setActiveTab(e.index === 0 ? 'liked' : e.index === 1 ? 'matched' : 'like')
                        setImageIndex(e.index)
                        console.log(e)
                    }}
                    circular={false}
                    horizontal={true}
                    bound={false}
                    duration={300}
                    threshold={40}
                    onReady={(e) => {
                        console.log("Flicking is ready")
                        // moveToを呼び出さずに状態のみ更新
                        setActiveTab('matched')
                        setImageIndex(1)
                    }}
                    style={{height: "100%"}}
                    className="w-full touch-pan-y"
                >
                    {/* 各スライドを1ページ幅に固定 */}
                    <div className="w-full h-full">
                        <FlickingContents likes={liked} type="liked"/>
                    </div>
                    <div className="w-full h-full">
                        <FlickingContents likes={matched} type="matched"/>
                    </div>
                    <div className="w-full h-full">
                        <FlickingContents likes={likes} type="like"/>
                    </div>
                </Flicking>
            </div>
        </div>
    )
}
