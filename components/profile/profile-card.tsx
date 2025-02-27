import Image from 'next/image'
import { useState } from 'react';
import { Badge } from '../ui/badge';

const profileData: ProfileData = {
    name: "Yuki",
    age: 24,
    gender: "女性",
    height: "165 cm",
    about: "新しい人と出会うのが好きです。お酒を飲みながら楽しい会話ができたらいいなと思います。",
    interests: ["ダンス", "料理", "ジャズ", "映画", "時々飲む"],
    favoriteBars: ["Bar Neon", "Space Lab"],
    imageUrl: "/persona/men/restaurant_owner.jpg",
    personalityTraits: [
        { name: "外向性", value: 80 },
        { name: "協調性", value: 90 },
        { name: "勤勉性", value: 70 },
        { name: "創造性", value: 85 },
        { name: "冒険心", value: 75 },
    ]
}

function calculateAge(birthday: any) {
    if (!birthday) return null;
    
    let birthDate;
    try {
      // Firestoreのタイムスタンプの場合
      if (birthday.toDate) {
        birthDate = birthday.toDate();
      } 
      // 通常の日付文字列の場合
      else {
        birthDate = new Date(birthday);
      }
  
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    } catch (error) {
      console.error('誕生日の計算エラー:', error);
      return null;
    }
}

export default function ProfileCard({ userData, isOwnProfile }: { userData: any, isOwnProfile: boolean }) {
    const [isExpanded, setIsExpanded] = useState(true);

    const handleClick = () => {
      setIsExpanded(!isExpanded);
      console.log(isExpanded);
    };
    return (
        <div className="w-full h-full">
            <div className="w-full h-full rounded-2xl relative flex flex-col overflow-hidden">
                
                <a href={"/profile/" + userData?.uid} 
                    className="w-full flex-1" 
                    style={{
                        transform: isExpanded ? "translate(0, 0)" : "translate(50px, 50px)",
                        width: "100%", 
                        flex: isExpanded ? 1 : 0,
                        transition: "all 0.5s ease-in-out",
                    }}/>
                
                <div
                    style={{
                        transition: "all 0.5s ease-in-out",
                        flex: isExpanded ? 0 : 1,
                        background: "rgba(0, 0, 0, 0.4)",
                        margin: isExpanded ? "0.5rem" : "0",
                        color: "#eee",
                    }}
                    className={`shadow-black-bg p-4 rounded-2xl ${isExpanded ? "expanded-card" : ""}`}
                    >
                    
                    {/* show contents */}
                    <div onClick={() => handleClick()}>
                        <p className=" text-2xl">
                            {userData?.name || "Loading..."} (
                                {calculateAge(userData?.birthday) || ""}
                            )
                        </p>
                        <p className=" text-xl">
                            性別: {userData?.gender || "Loading..."}
                        </p>
                        <p className=" text-xl">
                            身長: {userData?.height || "Loading..."}
                        </p>

                    </div>

                    {/* hide contents */}
                    <div style={{
                        height: isExpanded ? "0px" : "500px",
                        overflow: isExpanded ? "hidden" : "visible",
                        transition: "all 0.5s ease-in-out",
                        }}>
                        <section 
                            className="space-y-3 m-4" 

                            >

                            <h2 className="text-xl font-semibold">好きなお酒</h2>
                            <div className="flex flex-wrap gap-2">
                                {userData?.answers?.favorite_alcohol ? 
                                    Object.entries(userData.answers.favorite_alcohol.favorite_alcohol || {}).map(([alcoholName, details]) => (
                                    <Badge
                                        key={alcoholName + "name"}
                                        variant="secondary"
                                        className=" border-white/20 bg-white/5"
                                    >
                                        {details}
                                    </Badge>
                                    ))
                                : 
                                    <p className="text-[#c2b5ff]">データがありません</p>
                                }
                            </div>
                        </section>

                            {/* 苦手なお酒 */}
                        <section className="m-4 space-y-3">
                            <h2 className="text-xl font-semibold">苦手なお酒</h2>
                            <div className="flex flex-wrap gap-2">
                            {userData?.answers?.favorite_alcohol ? 
                                Object.entries(userData.answers.favorite_alcohol.dislike_alcohol || {}).map(([alcoholName, details]) => (
                                <Badge
                                    key={alcoholName + "name"}
                                    variant="secondary"
                                    className="text-white border-white/20 bg-white/5"
                                >
                                    {details}
                                </Badge>
                                ))
                            : 
                                <p className="text-[#c2b5ff]">データがありません</p>
                            }
                            </div>
                        </section>

                        {/* お気に入りのバー */}
                        <section className="m-4 space-y-3">
                                <h2 className="text-xl font-semibold">よく飲むお店</h2>
                                <div className="flex flex-wrap gap-2">
                                    {userData?.answers?.favorite_alcohol ? 
                                        Object.entries(userData.answers.favorite_alcohol.drinking_location_preference || {}).map(([alcoholName, details]) => (
                                        <Badge
                                            key={alcoholName + "name"}
                                            variant="secondary"
                                            className="text-white border-white/20 bg-white/5"
                                        >
                                            {details}
                                        </Badge>
                                        ))
                                    : 
                                        <p className="text-[#c2b5ff]">データがありません</p>
                                    }

                                </div>
                        </section>
                    </div>
                    


                </div>

                <Image
                src="/OIP.jpeg"
                alt="Profile"
                width={500}
                height={500}
                className="absolute top-0 left-0 w-full h-full object-cover rounded-2xl"
                style={{ zIndex: -1 }}
                />
            </div>
        </div>
    )
}