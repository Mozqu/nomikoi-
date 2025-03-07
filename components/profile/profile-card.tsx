import Image from 'next/image'
import { useEffect, useRef, useState } from 'react';
import { Badge } from '../ui/badge';
import Flicking, { MoveEvent, WillChangeEvent } from "@egjs/react-flicking";
import { motion } from "framer-motion"
import { getStorage, ref, listAll, getDownloadURL } from 'firebase/storage';

import "@egjs/react-flicking/dist/flicking.css";
import { Radar, PolarAngleAxis, PolarGrid, RadarChart, ResponsiveContainer, PolarRadiusAxis } from 'recharts';
import { LikeAction } from '@/components/like-action';


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
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    
    useEffect(() => {
        const fetchImages = async () => {
            if (!userData?.uid) return;
            
            try {
                const storage = getStorage();
                const imagesRef = ref(storage, `profile-image/${userData.uid}`);
                const imagesList = await listAll(imagesRef);
                
                const urls = await Promise.all(
                    imagesList.items.map(imageRef => getDownloadURL(imageRef))
                );
                
                setImageUrls(urls);
            } catch (error) {
                console.error('画像の取得に失敗しました:', error);
                // デフォルト画像を設定
                setImageUrls(['/OIP.jpeg']);
            }
        };
        
        fetchImages();
    }, [userData?.uid]);

    const chartParam = userData?.answers?.way_of_drinking;

    const basicInfo = userData?.profile;

    const profileData = {

        personalityTraits: [
            { name: "呑み時間", value: chartParam?.ideal_drinking_time},
            { name: "酒量", value: chartParam?.drinking_amount},
            { name: "頻度", value: chartParam?.drinking_frequency},
            { name: "食事", value: chartParam?.food_pairing_importance},
            { name: "こだわり", value: chartParam?.alcohol_quality_preference},
            { name: "パーティー", value: chartParam?.party_drink_preference},
        ]
    }
    const [isExpanded, setIsExpanded] = useState(true);

    const handleClick = () => {
      setIsExpanded(!isExpanded);
    };

    const [imageIndex, setImageIndex] = useState(0);
    useEffect(() => {

        console.log(imageIndex);
    }, [imageIndex]);

    const handleImageIndex = (index: number) => {
        setImageIndex(index);
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            id="card-container" 
            className="w-full h-full overflow-hidden rounded-2xl relative" 
            >

                <div id="like-action" className="absolute inline-block z-30"
                    style={{
                        bottom: isExpanded ? "6.5rem" : "1.5rem",
                        right: "1.5rem",
                        transition: "all 0.5s ease-in-out",
                    }}
                >
                    <LikeAction targetId={userData?.uid as string} />
                </div>

                <motion.div 
                    id="el" 
                    className="absolute flex flex-col bottom-0 w-full"
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{
                        top: isExpanded ? 0 : "0",
                    }}
                >
                    <div style={{
                        transition: "all 0.5s ease-in-out",
                        flex: isExpanded ? 1 : 0,
                    }}>

                    </div>
                    <div
                        style={{
                            transition: "all 0.5s ease-in-out",
                            flex: isExpanded ? 0 : 1,
                            background: "rgba(0, 0, 0, 0.6)",
                            margin: isExpanded ? "0.5rem" : "0rem",
                            color: "#eee",
                            zIndex: 1,
                            boxShadow: "0 0 10px 0 rgba(255, 255, 255, 0.5)",
                        }}
                        className={`shadow-black-bg rounded-2xl ${isExpanded ? "expanded-card" : ""}`}
                        >
                        
                        {/* show contents */}
                        <div 
                            className="p-4 rounded-2xl"
                            style={{
                                transition: "all 0.5s ease-in-out",
                                boxShadow: isExpanded ? "0 0 10px 0 rgba(255, 255, 255, 0.5)" : "0 0 0 rgba(255, 255, 255, 0.5)",
                            }}
                            onClick={() => handleClick()}>
                            <p className=" text-2xl">
                                {userData?.name || "Loading..."} (
                                    {calculateAge(userData?.birthday) || ""}
                                )
                            </p>

                            <p className="text-sm">
                                {basicInfo?.居住地}
                            </p>

                        </div>

                        {/* hide contents */}
                        <div style={{
                            height: isExpanded ? "0px" : "500px",
                            overflow: isExpanded ? "hidden" : "scroll",
                            transition: "all 0.5s ease-in-out",
                            }}>
                            <div className="flex flex-row">
                                {/* 呑みスタンス */}
                                <section className="space-y-3 m-4">
                                    <h2 className="text-xl font-semibold">性格</h2>
                                    <p className="text-sm">
                                        {userData.about}
                                    </p>
                                </section>

                                {/* chart */}
                                <section className="space-y-3 w-1/2">
                                    <div className="w-full h-40">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadarChart cx="50%" cy="50%" outerRadius="60%" data={profileData.personalityTraits}>
                                                <PolarGrid stroke="#6f2cff" />
                                                <PolarRadiusAxis domain={[0, 5]} tickCount={6} style={{ display: "none" }}/>
                                                <PolarAngleAxis dataKey="name" tick={{ fill: "#c2b5ff", fontSize: 10 }} />
                                                <Radar name="性格" dataKey="value" stroke="#fff" fill="#0ea5e9" fillOpacity={0.6} />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </section>
                            </div>
                            <section className="space-y-3 m-4">

                                <h2 className="text-xl font-semibold">好きなお酒</h2>
                                <div className="flex flex-wrap gap-2">
                                    {userData?.answers?.favorite_alcohol? 
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

                            <section className="m-4 space-y-3">
                                <h2 className="text-xl font-semibold">基本情報</h2>

                                {userData?.profile && Object.entries(userData?.profile).map(([key, value], index) => (
                                    <p key={`profile-${key}-${index}`} className="text-sm">
                                        {key}: {value}
                                    </p>
                                ))}
                            </section>
                            
                            <div className="h-20"></div>
                        </div>
                        


                    </div>
                </motion.div>

                <Flicking
                    viewportTag="div"
                    cameraTag="div"
                    cameraClass=""
                    renderOnSameKey={false}
                    align="center"
                    onMove={(e: MoveEvent) => {}}
                    onWillChange={(e: WillChangeEvent) => {handleImageIndex(e.index)}}
                    horizontal={true}
                    circular={false}
                    className="object-cover rounded-2xl"
                    style={{ zIndex: 0, height: "100%" }}
                    onClick={() => ""}
                >

                    {imageUrls.length > 0 ? (
                        imageUrls.map((url, index) => (
                            <Image
                                key={`profile-image-${index}`}
                                src={url}
                                alt="Profile"
                                width={500}
                                height={500}
                                style={{
                                    objectFit: "cover",
                                }}
                            />
                        ))
                    ) : (
                        <Image
                            src="/OIP.jpeg"
                            alt="Profile"
                            width={500}
                            height={500}
                            style={{
                                objectFit: "cover",
                            }}
                        />
                    )}

                </Flicking>

                {/* ページネーション */}
                <div 
                    className="flex flex-row justify-center items-center gap-2"
                    style={{
                        position: "absolute",
                        top: "1em",
                        width: "100%",
                        height: "0.5rem",
                        padding: "0 3rem",
                    }}
                >
                    
                    {imageUrls.length > 0 && (
                        imageUrls.map((_, index) => (
                            <div 
                                key={`pagination-dot-${index}`}
                                style={{
                                    flex: 1,
                                    width: "0.5rem",
                                    height: "0.5rem",
                                    backgroundColor: imageIndex === index ? "rgba(0, 0, 0, 0.7)" : "rgba(0, 0, 0, 0.2)",
                                }}
                                className="w-full h-full">
                            </div>
                        ))
                    )}
                </div>

        </motion.div>
    )
}