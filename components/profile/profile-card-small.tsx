import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { getDownloadURL, getStorage, listAll, ref } from "firebase/storage"
import { Button } from "../ui/button"
import { Star } from "lucide-react"
import { collection, doc, getDoc, serverTimestamp, setDoc, Timestamp, Firestore } from "firebase/firestore"
import Image from "next/image"
import { auth } from "@/app/firebase/config"
import { db } from "@/app/firebase/config"

// User型を定義
interface User {
    id: string;
    name: string;
    photoURL: string;
    birthday: Timestamp | null;
    location?: string;
    profile: {
        "居住地": string;
    }
}

interface DrinkingMood {
    mood: string;
    updatedAt: Timestamp;
}

const getMoodIcon = (mood: string): string => {
    switch (mood) {
        case 'daytime':
            return '☀️';
        case 'evening':
            return '🌙';
        case 'night':
            return '🌃';
        case 'morning':
            return '🌅';
        default:
            return '';
    }
}

interface UserCardProps {
    user: User
}

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

export default function ProfileCardSmall({ user }: UserCardProps) {
    const router = useRouter()
    const age = calculateAge(user.birthday)
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [drinkingMood, setDrinkingMood] = useState<DrinkingMood | null>(null);

    useEffect(() => {
        const fetchDrinkingMood = async () => {
            if (!user?.id || !db) return;
            
            try {
                const drinkingMoodRef = doc(db as Firestore, 'drinkingMoods', user.id);
                const drinkingMoodDoc = await getDoc(drinkingMoodRef);
                
                if (drinkingMoodDoc.exists()) {

                    
                    setDrinkingMood(drinkingMoodDoc.data() as DrinkingMood);
                }
            } catch (error) {
                console.error('飲酒ムードの取得に失敗しました:', error);
            }
        };
        
        fetchDrinkingMood();
    }, [user?.id]);

    useEffect(() => {
        const fetchImages = async () => {
            if (!user?.id) return;
            
                try {
                    const storage = getStorage();
                    const imagesRef = ref(storage, `profile-image/${user.id}`);
                    const imagesList = await listAll(imagesRef);
                    
                    const urls = await Promise.all(
                        imagesList.items.map(imageRef => getDownloadURL(imageRef))
                    );
                    
                    setImageUrls(urls);
                } catch (error) {
                    console.error('画像の取得に失敗しました:', error);
                    // デフォルト画像を設定
                    setImageUrls(['/placeholder-user.png']);
                }
        };
        
        fetchImages();
    }, [user?.id]);

    
    return (
      <div 
        className="relative rounded-xl "
        style={{
            width: '100%',
            aspectRatio: '3/4',
        }}
        onClick={() => router.push(`/profile/${user.id}`)}
      >
        <div className="relative rounded-xl w-full h-full overflow-hidden aspect-[3/4] bg-white shadow cursor-pointer transition-transform hover:scale-105">
          {imageUrls[0] ? (
            <Image 
              src={imageUrls[0]}
              alt={user?.name || 'ユーザープロフィール画像'}
              fill 
              className="object-cover"
            />
          ) : (
            <Image 
              src={user.photoURL || "/placeholder.svg"}
              alt={user?.name || 'ユーザープロフィール画像'}
              fill 
              className="object-cover"
            />
          )}
          
          {/* お気に入りボタン 
          <div className="absolute top-2 right-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 bg-white/80 hover:bg-white shadow-md"
              onClick={(e) => {
                e.stopPropagation() // カードのクリックイベントを停止
                // お気に入りの処理をここに追加
              }}
            >
              <Star className="h-4 w-4" />
            </Button>
          </div>
          */}
    
          {/* NEWバッジ */}
          {drinkingMood && (
              <div className="absolute top-2 left-2">
                  <span className="text-xs text-white/90 drop-shadow-lg bg-pink-500/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                      {getMoodIcon(drinkingMood.mood)}
                  </span>
              </div>
          )}
      
          {/* ユーザー情報 */}
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/60 to-transparent">
            <div className="flex flex-col gap-1">
              <div className="">
                <p className="text-base font-semibold text-white drop-shadow-lg">
                  {user.name}
                </p>
                <div className="flex justify-between gap-1">
                  {age && (
                    <span className="text-xs font-medium text-white/90 drop-shadow-lg">
                      {age}歳
                    </span>
                  )}
                  {user.profile?.居住地 && (
                    <span className="text-xs text-white/90 drop-shadow-lg">
                      {user.profile.居住地}
                    </span>
                  )}
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }