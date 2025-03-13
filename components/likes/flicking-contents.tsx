import Flicking from "@egjs/react-flicking"
import ProfileCardSmall from "../profile/profile-card-small"
import { useUser } from "@/hooks/users"

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
  

export default function FlickingContents({ likes, bgColor }: { likes: any[], bgColor: string }) {
    return (
        
        <div className={`panel ${bgColor} w-full h-full`}>
            {/* 各スライドを1ページ幅に固定 */}
            <div 
                className="flex flex-wrap gap-4 w-full h-full" 
            >
                {likes.slice(0, 5).map((like) => (
                    <LikeItem key={like.id} like={like} />
                ))}
                
            </div>
        </div>
        
    )
}
