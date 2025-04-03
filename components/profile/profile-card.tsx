import Image from 'next/image'
import { useEffect, useRef, useState } from 'react';
import { Badge } from '../ui/badge';
import Flicking, { MoveEvent, WillChangeEvent } from "@egjs/react-flicking";
import { motion } from "framer-motion"
import { getStorage, ref, listAll, getDownloadURL } from 'firebase/storage';

import "@egjs/react-flicking/dist/flicking.css";
import { Radar, PolarAngleAxis, PolarGrid, RadarChart, ResponsiveContainer, PolarRadiusAxis } from 'recharts';
import { LikeAction } from '@/components/like-action';
import { collection, query, where } from 'firebase/firestore';
import { getDocs } from 'firebase/firestore';
import { auth, db } from '@/app/firebase/config';
import { Button } from '../ui/button';
import Link from 'next/link';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Beer, Coffee, Martini, Wine } from 'lucide-react';

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

const getLoginStatus = (lastLogin: any) => {
    if (!lastLogin) return { color: "bg-gray-400", text: "24時間以上操作していません" };
    
    try {
        // lastLoginは既にサーバータイムスタンプとして保存されている
        const loginDate = lastLogin.toDate();
        const now = new Date();
        const hoursDiff = (now.getTime() - loginDate.getTime()) / (1000 * 60 * 60);
        
        if (hoursDiff <= 1) {
            return { color: "bg-green-400", text: "オンライン" };
        } else if (hoursDiff <= 24) {
            return { color: "bg-yellow-400", text: "最近オンライン" };
        } else {
            return { color: "bg-gray-400", text: "オフライン" };
        }
    } catch (error) {
        console.error('ログイン状態の計算エラー:', error);
        return { color: "bg-gray-400", text: "オフライン" };
    }
};

export default function ProfileCard({ userData, isOwnProfile }: { userData: any, isOwnProfile: boolean }) {
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [drinkingMood, setDrinkingMood] = useState<any>(null);

    const getTimeZoneIcon = (timeZone: string) => {
        switch(timeZone) {
            case 'daytime':
                return '☀️';
            case 'evening':
                return '🌙';
            case 'night':
                return '🌃';
            case 'morning':
                return '🌅';
            default:
                return '⏰';
        }
    };

    const getTimeZoneLabel = (timeZone: string) => {
        switch(timeZone) {
            case 'daytime':
                return '日中から';
            case 'evening':
                return '夕方から';
            case 'night':
                return '深夜から';
            case 'morning':
                return '早朝から';
            default:
                return '時間未設定';
        }
    };

    const getDrinkIcon = (drinkTypes: string[] | undefined) => {
        if (!drinkTypes || drinkTypes.length === 0) return <Coffee className="w-4 h-4" />;
        
        const firstDrink = drinkTypes[0];
        switch(firstDrink) {
            case 'ビール':
                return <Beer className="w-4 h-4" />;
            case 'ワイン':
                return <Wine className="w-4 h-4" />;
            case 'カクテル':
                return <Martini className="w-4 h-4" />;
            default:
                return <Coffee className="w-4 h-4" />;
        }
    };
    
    useEffect(() => {
        const fetchImages = async () => {
            if (!userData) {
                console.error('ユーザーデータが存在しません');
                setImageUrls(['/placeholder-user.png']);
                return;
            }

            const userId = userData.uid || userData.id;
            if (!userId) {
                console.error('ユーザーIDが見つかりません');
                setImageUrls(['/placeholder-user.png']);
                return;
            }
            
            try {
                const storage = getStorage();
                const imagesRef = ref(storage, `profile-image/${userId}`);
                console.log('画像の取得を試みます:', `profile-image/${userId}`);
                
                const imagesList = await listAll(imagesRef);
                
                if (imagesList.items.length === 0) {
                    console.log('画像が見つかりませんでした');
                    setImageUrls(['/placeholder-user.png']);
                    return;
                }

                const urls = await Promise.all(
                    imagesList.items.map(imageRef => getDownloadURL(imageRef))
                );

                console.log('画像の取得に成功しました:', urls);
                setImageUrls(urls);
            } catch (error) {
                console.error('画像の取得に失敗しました:', error);
                setImageUrls(['/placeholder-user.png']);
            }
        };
        
        fetchImages();
    }, [userData]);

    useEffect(() => {
        const fetchDrinkingMood = async () => {
            if (!userData?.uid) return;

            try {
                const moodsRef = collection(db, 'drinkingMoods');
                const q = query(
                    moodsRef,
                    where('uid', '==', userData.uid),
                    where('createdAt', '>=', new Date(new Date().setHours(0, 0, 0, 0)))
                );
                
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    const moodData = querySnapshot.docs[0].data();
                    setDrinkingMood(moodData);
                }
            } catch (error) {
                console.error('飲み気分の取得に失敗:', error);
            }
        };

        fetchDrinkingMood();
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
    const [isShrinked, setIsShrinked] = useState(false);
    const startY = useRef<number | null>(null);
    const showContentsRef = useRef<HTMLDivElement>(null);
    
    const handleClick = () => {
        console.log('クリックでの切り替え:', !isExpanded ? '開く' : '閉じる');
        if (isShrinked) {
            setIsExpanded(true);
            setIsShrinked(false);
        } else {
            setIsExpanded(!isExpanded);
        }
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
  
    const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

    const handleScroll = (e: any) => {
        // スクロールイベントをデバウンス
        if (scrollTimeout.current) {
            clearTimeout(scrollTimeout.current);
        }
        
        scrollTimeout.current = setTimeout(() => {
            console.log('スクロール位置:', e.target.scrollTop);
            // スクロール位置が0（一番上）の場合、isExpandedをfalseに設定
            if (e.target.scrollTop < 0.5) {
                console.log('最上部でのスクロール: カードを閉じます');
                setIsExpanded(!isExpanded);
            }
        }, 100); // 100ミリ秒のデバウンス
    }

    const handleScrollDown = (e: any) => {
        const hideContents = document.querySelector('#hide-contents');
        if (hideContents) {
          hideContents.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        }
    }

    useEffect(() => {
        setIsShrinked(false);
    }, [isExpanded]);

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

    const [characterResults, setCharacterResults] = useState<any>(null);

    useEffect(() => {
        const fetchCharacterResults = async () => {
            if (!userData?.uid) return;
            
            try {
                const resultsRef = collection(db, 'character_results');
                const q = query(resultsRef, where('userId', '==', userData.uid));
                const querySnapshot = await getDocs(q);
                
                if (!querySnapshot.empty) {
                    const latestResult = querySnapshot.docs[0].data().results;
                    setCharacterResults(latestResult);
                }
            } catch (error) {
                console.error('キャラクター診断結果の取得に失敗:', error);
            }
        };

        fetchCharacterResults();
    }, [userData?.uid]);

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
                        bottom: isShrinked ? "5.5rem" : isExpanded ? "15.5rem" : "1.5rem",
                        right: "1rem",
                        transition: "all 0.5s ease-in-out",
                    }}
                >
                    <LikeAction targetId={userData?.id as string} />
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
                            ref={showContentsRef}
                            className="pt-4 px-4 pb-2 rounded-2xl"
                            style={{
                                transition: "all 0.5s ease-in-out",
                            }}
                            onClick={() => handleClick()}
                            onTouchStart={(e) => {
                                // イベントバブリングを防止せず、親要素のハンドラも実行されるようにする
                                startY.current = e.touches[0].clientY;
                            }}
                            onTouchMove={(e) => {
                                if (!startY.current) return;
                                
                                const currentY = e.touches[0].clientY;
                                const diffY = currentY - startY.current;
                                
                                
                                if (isExpanded) { // 普通の状態
                                    if (diffY > 30) {
                                        setIsShrinked(true);
                                    } else if (diffY < -30) {
                                        console.log('showContents 上にスワイプ: カードを開きます');
                                        setIsExpanded(false);
                                        setIsShrinked(false);
                                        startY.current = null;
                                    }
                                } else{ // 大きい状態
                                    if (diffY > 30) {
                                        console.log('showContents 下にスワイプ: カードを閉じます');
                                        setIsExpanded(true);
                                        startY.current = null;
                                    }
                                }

                                

                            }}
                            onTouchEnd={() => {
                                startY.current = null;
                            }}
                        >
                            <div className="absolute top-0 left-0 p-2 flex justify-center items-center w-full">
                                <span className="block h-1 w-10 bg-white rounded-full"></span>
                            </div>

                            <div className="flex flex-row justify-between">
                                {/* 基本情報 */}
                                <div>
                                    {/* 名前 */}
                            <p className=" text-2xl">
                                {userData?.name || "Loading..."} (
                                    {calculateAge(userData?.birthday) || ""}
                                )
                            </p>

                                    {/* 居住地 */}
                                <div className="flex flex-row">
                                    <p className="text-sm">
                                        {basicInfo?.居住地}
                                    </p>
                                        <div className="flex items-center gap-1.5 ml-2">
                                            <span className={`inline-block w-2 h-2 rounded-full ${getLoginStatus(userData?.lastLogin).color}`}></span>
                                            <p className="text-xs text-white/60">
                                                {getLoginStatus(userData?.lastLogin).text}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* 飲み気分 */}
                                <div className="">
                                    {drinkingMood && (
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button 
                                                variant="outline" 
                                                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 py-1"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                }}
                                            >
                                                <span className="text-xl">{getTimeZoneIcon(drinkingMood.startTimeZone)}</span>
                                                <span>{getTimeZoneLabel(drinkingMood.startTimeZone)} </span>
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent 
                                            className="w-[calc(100vw-2rem)] max-w-[350px] bg-black/95 mx-2 text-white border border-white/20 shadow-lg shadow-purple-500/20 backdrop-blur-sm"
                                            sideOffset={5}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                            }}
                                        >
                                            <div className="space-y-2 p-1.5">
                                                <h3 className="text-sm font-semibold border-b border-white/20 pb-1.5 flex items-center gap-1.5">
                                                    <span className="text-base">🍻</span>
                                                    今日の飲み気分
                                                </h3>
                                                
                                                <>
                                                    {/* 時間に関する情報をグループ化 */}
                                                    <div className="bg-white/5 p-1.5 rounded-lg space-y-1.5">
                                                        <div className="flex items-center gap-1.5 border-b border-white/10 pb-1.5">
                                                            <span className="text-base">{getTimeZoneIcon(drinkingMood.startTimeZone)}</span>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-xs font-medium truncate">{getTimeZoneLabel(drinkingMood.startTimeZone)}</p>
                                                                <p className="text-[10px] text-white/60">{drinkingMood.startTime || '時間未設定'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-base">⏱️</span>
                                                            <p className="text-xs">{drinkingMood.timeStance || '未設定'}</p>
                                                        </div>
                                                    </div>

                                                    {/* 雰囲気 */}
                                                    <div className="bg-white/5 p-1.5 rounded-lg">
                                                        <div className="flex items-start gap-1.5">
                                                            <span className="text-base">✨</span>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-xs font-medium mb-1">お店の雰囲気</p>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {drinkingMood.atmosphere?.map((atm: string) => (
                                                                        <span key={atm} className="px-1.5 py-0.5 rounded-full bg-white/10 text-[10px]">
                                                                            {atm}
                                                                        </span>
                                                                    )) || '未設定'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* 同伴者情報 */}
                                                    {drinkingMood.companions && (
                                                        <div className="bg-white/5 p-1.5 rounded-lg">
                                                            <div className="flex items-start gap-1.5">
                                                                <span className="text-base">👥</span>
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="text-xs font-medium mb-0.5">同伴人数</p>
                                                                    <div className="flex gap-2 text-[10px] text-white/80">
                                                                        <p>男性 {drinkingMood.companions.male || 0}人</p>
                                                                        <p>女性 {drinkingMood.companions.female || 0}人</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* メモ */}
                                                    {drinkingMood.customNotes && (
                                                        <div className="bg-white/5 p-1.5 rounded-lg">
                                                            <div className="flex items-start gap-1.5">
                                                                <span className="text-base">📝</span>
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="text-xs font-medium mb-0.5">メモ</p>
                                                                    <p className="text-[10px] text-white/80">{drinkingMood.customNotes}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="text-[10px] text-white/60 text-right flex items-center justify-end gap-1">
                                                        <span>🕒</span>
                                                        更新: {drinkingMood.createdAt?.toDate().toLocaleString() || '未設定'}
                                                    </div>
                                                </>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                    )}
                                </div>
                            </div>
                            


                        </div>


                        {/* hide contents */}
                        <div 
                            id="hide-contents"
                            style={{
                                overflow: isExpanded ? "hidden" : "scroll",
                                transition: "all 0.5s ease-in-out",
                                transform: isShrinked ? "translateY(100%)" : "translateY(0)",
                                opacity: isShrinked ? 0 : 1,
                                position: "relative",
                            }}
                            onScroll={(e) => handleScroll(e)}
                        >

                            <div className="flex">
                                <div className="flex flex-row">
                                    {/* 呑みスタンス */}

                                </div>

                                {/* chart */}
                                <section
                                    style={{
                                        transition: "all 0.3s ease-in-out",
                                        maxHeight: isShrinked ? "0" : "300px",
                                    }}
                                    className="flex-1 flex" onClick={() => handleClick()}>

                                    {characterResults ? (
                                        <div className="w-full h-40 relative flex justify-center items-center">
                                            <div className="text-center p-2">
                                                <p className="text-sm">飲みタイプ</p>
                                                <div className="flex flex-col justify-center items-center">
                                                    <p className="text-sm">{characterResults.characterType}</p>
                                                    <p className="text-sm">x</p>
                                                    <p className="text-sm">{characterResults.characterName}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : isOwnProfile ? (
                                        <div className="w-full h-40 relative">
                                            <div className="text-center p-2 space-y-2">
                                                <p className="text-sm">飲みタイプがありません</p>
                                                <p className="text-sm">診断しましょう！</p>
                                                <Button variant="secondary" className="neon-bg text-white px-4 py-2 rounded-md">
                                                    <Link href="/register/drinking_character">診断する</Link>
                                                </Button>
                                            </div>
                                        </div>
                                    ) : null}
                                    
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

                            </div>
                            <div style={{
                                height: isExpanded ? "0px" : "500px",
                                transition: "all 0.5s ease-in-out",
                                }}>
                                {userData?.answers?.favorite_alcohol && (
                                <section className="space-y-3 m-4">
                                    <h2 className="text-xl font-semibold">好きなお酒</h2>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(userData.answers.favorite_alcohol.favorite_alcohol || {}).map(([alcoholName, details]) => (
                                        <Badge
                                            key={alcoholName + "name"}
                                            variant="secondary"
                                            className=" border-white/20 bg-white/5"
                                        >
                                            {details || ""}
                                        </Badge>
                                        ))}
                                    </div>
                                </section>
                                )}

                                <section className="space-y-3 m-4">
                                    <p className="text-sm">
                                        {userData.bio}
                                    </p>
                                </section>

                                {/* 苦手なお酒 */}
                                {userData?.answers?.favorite_alcohol && (

                                    <section className="m-4 space-y-3">
                                        <h2 className="text-xl font-semibold">苦手なお酒</h2>
                                        <div className="flex flex-wrap gap-2">
                                            {userData?.answers?.favorite_alcohol && (
                                                Object.entries(userData.answers.favorite_alcohol.dislike_alcohol || {}).map(([alcoholName, details]) => (
                                                <Badge
                                                    key={alcoholName + "name"}
                                                    variant="secondary"
                                                    className="text-white border-white/20 bg-white/5"
                                                >
                                                    {details}
                                                </Badge>
                                                ))
                                            )}
                                        </div>
                                    </section>
                                )}

                                {/* お気に入りのバー */}
                                {userData?.answers?.favorite_alcohol.drinking_location_preference && (
                                <section className="m-4 space-y-3">
                                    <h2 className="text-xl font-semibold">よく飲むお店</h2>
                                    <div className="flex flex-wrap gap-2">
                                        {userData?.answers?.favorite_alcohol && (
                                            Object.entries(userData.answers.favorite_alcohol.drinking_location_preference || {}).map(([alcoholName, details]) => (
                                            <Badge
                                                key={alcoholName + "name"}
                                                variant="secondary"
                                                className="text-white border-white/20 bg-white/5"
                                            >
                                                {details}
                                            </Badge>
                                            ))
                                        )}
                                    </div>
                                </section>
                                )}
                            
                                {/* お気に入りのエリア */}
                                {userData?.answers?.favorite_alcohol.favorite_location && (
                                <section className="m-4 space-y-3">
                                    <h2 className="text-xl font-semibold">お気に入りのエリア</h2>
                                    <div className="flex flex-wrap gap-2">
                                        {userData?.answers?.favorite_alcohol.favorite_location && (
                                            Object.entries(userData.answers.favorite_alcohol.favorite_location || {}).map(([alcoholName, details]) => (
                                                <Badge
                                                    key={alcoholName + "name"}
                                                    variant="secondary"
                                                    className="text-white border-white/20 bg-white/5"
                                                >
                                                    {details}
                                                </Badge>
                                            ))
                                        )}
                                    </div>
                                </section>
                                )}

                                {/* お気に入りの時間帯 */}
                                {userData?.answers?.favorite_alcohol.favorite_timezone && (
                                <section className="m-4 space-y-3">
                                    <h2 className="text-xl font-semibold">お気に入りの時間帯</h2>
                                    <div className="flex flex-wrap gap-2">
                                        {userData?.answers?.favorite_alcohol.favorite_timezone && (
                                            Object.entries(userData.answers.favorite_alcohol.favorite_timezone || {}).map(([alcoholName, details]) => (
                                            <Badge
                                                key={alcoholName + "name"}
                                                variant="secondary"
                                                className="text-white border-white/20 bg-white/5"
                                            >   
                                                {details}
                                            </Badge>
                                            ))
                                        )}
                                    </div>
                                </section>
                                )}


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
                    bound={true}
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
                            src="/placeholder-user.png"
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