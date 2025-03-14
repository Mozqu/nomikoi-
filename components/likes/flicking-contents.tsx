import Flicking from "@egjs/react-flicking"
import ProfileCardSmall from "../profile/profile-card-small"
import { useUser } from "@/hooks/users"
import { fetchUserImage } from "@/hooks/fetch-image"

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
    return (
        
        <div className={`panel w-full h-full`}>
            {/* 各スライドを1ページ幅に固定 */}
            <div 
                className="flex flex-wrap gap-4 w-full h-full" 
            >
                {likes.length > 0 ? likes.slice(0, 5).map((like) => (
                    <LikeItem key={like.id} like={like} type={type} />
                )) : (
                    <div className="w-full h-full">
                        <p>データがありません</p>
                    </div>
                )}
                
            </div>
        </div>
        
    )
}
