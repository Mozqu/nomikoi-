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
                setImageUrls(['/home-background.jpg']);
            }
        };
        
        fetchImages();
    }, [userData?.uid]);

    const chartParam = userData?.answers?.way_of_drinking;

    const basicInfo = userData?.profile;

    const profileData = {

        personalityTraits: [
            { name: "飲み時間", value: chartParam?.ideal_drinking_time || 0},
            { name: "飲む量", value: Math.round(5 * chartParam?.drinking_amount / 6 * 10) / 10 || 0},
            { name: "飲み頻度", value: chartParam?.drinking_frequency || 0},
            { name: "食事との相性", value: chartParam?.food_pairing_importance || 0},
            { name: "酒こだわり", value: chartParam?.alcohol_quality_preference || 0},
            { name: "パーティー", value: chartParam?.party_drink_preference || 0},
        ]
    }
    const [isExpanded, setIsExpanded] = useState(true);

    const handleClick = () => {
      setIsExpanded(!isExpanded);
      if (!isExpanded) {
        // hideContentsの要素を取得して最上部までスクロール
        const hideContents = document.querySelector('#hide-contents');
        if (hideContents) {
          hideContents.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        }
      }
    };

    const [imageIndex, setImageIndex] = useState(0);


    const handleImageIndex = (index: number) => {
        setImageIndex(index);
    }

    {/*基本情報のカテゴリ分けのための配列*/}
    const basicInfoCategory = [
        "身長",
        "体重",
        "血液型",
        "出身地",
        "居住地",
        "兄弟・姉妹構成",
        "話せる言語",
        "チャームポイント",        
    ]

    const educationInfoCategory = [
        "職種",
        "職業名",
        "学歴",
        "年収",
        "学校名",
    ]

    const loveInfoCategory = [
        "結婚歴",
        "子供の有無",
        "結婚に対する意思",
        '子供が欲しいか',
        '家事・育児',
        'であうまでの希望',
        'デート費用'        
    ]

    const personalityHobbiesLifestyle = [
        '１６タイプ (MBTI)',
        '同居人',
        'タバコ',
        '飼っているペット',
        '休日',
        '好きな料理・店',
    ]

    return (
        <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            id="card-container" 
            className="w-full h-full overflow-hidden rounded-2xl relative" 
            >
                {/* like action */}
                {!isOwnProfile && (
                <div id="like-action" className="absolute inline-block z-30"
                    style={{
                        bottom: isExpanded ? "19rem" : "1.5rem",
                        right: "1rem",
                        transition: "all 0.5s ease-in-out",
                    }}
                >
                    <LikeAction targetId={userData?.uid as string} />
                </div>
                )}

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
                            boxShadow: isExpanded ? "0 0 10px 0 rgba(255, 255, 255, 0.5)" : "0 0 0 rgba(255, 255, 255, 0.5)",
                            height: "100%",
                        }}
                        className={`flex flex-col shadow-black-bg rounded-2xl ${isExpanded ? "expanded-card" : ""}`}
                        >
                        
                        {/* show contents */}
                        <div 
                            className="p-4 rounded-2xl"
                            style={{
                                transition: "all 0.5s ease-in-out",
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
                        <div 
                            id="hide-contents"
                            style={{
                            overflow: isExpanded ? "hidden" : "scroll",
                            transition: "all 0.5s ease-in-out",
                            }}>


                                <div className="flex flex-row">
                                    {/* 呑みスタンス */}
                                    <section className="space-y-3 m-4">
                                        <p className="text-sm">
                                            {userData.bio}
                                        </p>
                                    </section>
                                </div>

                                {/* chart */}
                                <section className="space-y-3 flex-1" onClick={() => handleClick()}>
                                    <div className="w-full h-40 relative">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadarChart cx="50%" cy="50%" outerRadius="60%" data={profileData.personalityTraits}>
                                                <PolarGrid stroke="#6f2cff" />
                                                <PolarRadiusAxis domain={[0, 5]} tickCount={6} style={{ display: "none" }}/>
                                                <PolarAngleAxis dataKey="name" tick={{ fill: "#c2b5ff", fontSize: 10 }} />
                                                <Radar name="性格" dataKey="value" stroke="#fff" fill="#000" fillOpacity={0.6} />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </section>


                            <div style={{
                                height: isExpanded ? "0px" : "500px",
                                transition: "all 0.5s ease-in-out",
                                }}>

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
                                    <table className="w-full">
                                        <tbody>
                                            {userData?.profile && Object.entries(userData?.profile)
                                                .filter(([key]) => basicInfoCategory.includes(key))
                                                .map(([key, value], index) => (
                                                    
                                                    <tr
                                                        style={{
                                                            borderBottom: "1px solid #999",
                                                        }}
                                                        key={`profile-${key}-${index}`}
                                                    >
                                                        <td className="text-sm p-1">{key}</td>
                                                        <td className="text-sm p-1">{value}</td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>

                                    <h2 className="text-xl font-semibold">学歴・職歴</h2>
                                    <table className="w-full">
                                        <tbody>
                                            {userData?.profile && Object.entries(userData?.profile)
                                                .filter(([key]) => educationInfoCategory.includes(key))
                                                .map(([key, value], index) => (
                                                    <tr
                                                        style={{
                                                            borderBottom: "1px solid #999",
                                                        }}
                                                        key={`profile-${key}-${index}`}
                                                    >
                                                        <td className="text-sm p-1">{key}</td>
                                                        <td className="text-sm p-1">{value}</td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                    
                                    <h2 className="text-xl font-semibold">恋愛・結婚</h2>
                                    <table className="w-full">
                                        <tbody>
                                            {userData?.profile && Object.entries(userData?.profile)
                                                .filter(([key]) => loveInfoCategory.includes(key))
                                                .map(([key, value], index) => (
                                                    <tr
                                                        style={{
                                                            borderBottom: "1px solid #999",
                                                        }}
                                                        key={`profile-${key}-${index}`}
                                                    >
                                                        <td className="text-sm p-1">{key}</td>
                                                        <td className="text-sm p-1">{value}</td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>

                                    <h2 className="text-xl font-semibold">性格・趣味・生活</h2>
                                    <table className="w-full">
                                        <tbody>
                                            {userData?.profile && Object.entries(userData?.profile)
                                                .filter(([key]) => personalityHobbiesLifestyle.includes(key))
                                                .map(([key, value], index) => (
                                                <tr
                                                    style={{
                                                        borderBottom: "1px solid #999",
                                                    }}
                                                    key={`profile-${key}-${index}`}
                                                >
                                                    <td className="text-sm p-1">{key}</td>
                                                    <td className="text-sm p-1">{value}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>


                                </section>
                                
                                <div className="w-full" style={{height: "100px"}}></div>

                            </div>
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
                    bound={false}
                    className="object-cover rounded-2xl"
                    style={{ zIndex: 0, height: "100%" }}
                    defaultIndex={0}
                    moveType="snap"
                    duration={500}
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
                                className="w-full h-full"
                            />
                        ))
                    ) : (
                        <Image
                            src="/home-background.jpg"
                            alt="Profile"
                            width={500}
                            height={500}
                            style={{
                                objectFit: "cover",
                            }}
                            className="w-full h-full"
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