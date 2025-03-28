import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Firebase Admin の初期化
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

console.log('=== recommended route ===')

// ブロックの外に関数を移動し、constで宣言
const isDrinkingHabitCompatible = (
  currentUserAcceptableDrinkingHabit: any,
  currentUserDrinkingHabit: any,
  targetUserHabit: any,
  targetUserDrinkingNonDrinker?: boolean
): boolean => {
  
  if (!targetUserHabit || !currentUserAcceptableDrinkingHabit) {
    console.log("skip: missing data");
    return true;
  } else {
    console.log("continue: data is not missing");
    console.log("targetUserHabit:", targetUserHabit);
    console.log("currentUserAcceptableDrinkingHabit:", currentUserAcceptableDrinkingHabit);
  }

  // 各IDに対してフィルタリングを実行
  const drinkingIds = [
    "drink_non_drinker",
    "drink_turns_red",
    "drink_gets_sleepy",
    "drink_gets_wasted",
    "drink_until_blackout",
    "drink_forgets_after",
    "drink_loses_memory",
    "drink_laughs_hard",
    "drink_talks_to_others",
    "drink_gets_angry",
    "drink_cries",
    "drink_contacts_others",
    "drink_outdoor_enjoy"
  ];

  return drinkingIds.every(id => {
    const currentAcceptable = currentUserAcceptableDrinkingHabit[id]?.value || 0;
    //const currentHabit = currentUserDrinkingHabit[id]?.value || 0;
    const targetValue = targetUserHabit[id]?.value || 0;
    console.log("id:", id, "currentAcceptable:", currentAcceptable, "targetValue:", targetValue)
    // R（currentAcceptable）に基づくフィルタリング
    switch (currentAcceptable) {
      case 5:
        return true; // どの相手ともマッチング可
      case 4:
        console.log(targetValue, currentAcceptable - 3)
        return targetValue >= (currentAcceptable - 3);
      case 3:
        console.log(targetValue, currentAcceptable - 2)
        return targetValue > 0 && targetValue >= (currentAcceptable - 2);
      case 2:
        console.log(targetValue, currentAcceptable - 1)
        return targetValue > 0 && targetValue >= (currentAcceptable - 1);
      case 1:
        console.log(targetValue, currentAcceptable)
        return targetValue >= currentAcceptable;
      default:
        return true; // 許容度が設定されていない場合はマッチング可
    }
  });
};

export async function GET(request: Request) {
  try {
    // URLパラメータから現在のユーザーIDと性別を取得
    const { searchParams } = new URL(request.url);
    const currentUserId = searchParams.get('userId');
    const currentUserGender = searchParams.get('gender');

    // パラメータのバリデーション
    if (!currentUserId || !currentUserGender) {
      return NextResponse.json(
        { error: 'User ID and gender are required' },
        { status: 400 }
      );
    }

    // 異性のユーザーを取得するクエリを構築
    // 作成日時の降順で最大50件を取得
    const usersRef = db.collection('users');
    const recommendedUsersQuery = usersRef
      .where('gender', '==', currentUserGender === '女性' ? '男性' : '女性')
      .orderBy('createdAt', 'desc')
      .limit(50);
    const recommendedUsersSnapshot = await recommendedUsersQuery.get();

    // 現在のユーザーの性格診断結果を取得
    const characterResultsRef = db.collection('character_results');
    const currentUserCharacterResult = await characterResultsRef
      .where('userId', '==', currentUserId)
      .limit(1)
      .get();

    const currentUserCharacter = currentUserCharacterResult.docs[0]?.data() || null;

    // 現在のユーザーの飲み方を取得
    const currentUserData = await db.collection('users')
      .where('uid', '==', currentUserId)
      .limit(1)
      .get();

    const currentUserDrinking = currentUserData.docs[0]?.data().answers?.way_of_drinking || {};

    const currentUserPreference = currentUserData.docs[0]?.data().answers.favorite_alcohol || {};

    // 相性計算のユーティリティ関数
    const calculateCompatibility = (user1Character: any, user2Character: any) => {
      if (!user1Character || !user2Character) return 0;
      
      try {
        
        // alphabetプロパティの存在確認
        if (!user1Character.results.alphabet || !user2Character.results.alphabet) {
          console.error('Missing alphabet property:', {
            user1HasAlphabet: !!user1Character.results.alphabet,
            user2HasAlphabet: !!user2Character.results.alphabet
          });
          return 0;
        }

        let totalScore = 0;
        
        // E/I（外向・内向）の相性計算
        const eiFactor = (char1: string, char2: string) => {
          if ((char1 === 'E' && char2 === 'E') || (char1 === 'I' && char2 === 'I')) return 4;
          return 0; // E-Iの組み合わせ
        };
        
        // A/H（協調・主張）の相性計算
        const ahFactor = (char1: string, char2: string) => {
          if (char1 === 'A' && char2 === 'A') return 4;
          if ((char1 === 'A' && char2 === 'H') || (char1 === 'H' && char2 === 'A')) return 2;
          if (char1 === 'H' && char2 === 'H') return -4;
          return 0;
        };
        
        // C/R（計画・衝動）の相性計算
        const crFactor = (char1: string, char2: string) => {
          if ((char1 === 'C' && char2 === 'C') || (char1 === 'R' && char2 === 'R')) return 4;
          return 0; // C-Rの組み合わせ
        };
        
        // N/T（安定・繊細）の相性計算
        const ntFactor = (char1: string, char2: string) => {
          if (char1 === 'N' && char2 === 'N') return 4;
          if ((char1 === 'N' && char2 === 'T') || (char1 === 'T' && char2 === 'N')) return 2;
          if (char1 === 'T' && char2 === 'T') return -4;
          return 0;
        };
        
        // O/S（開放・保守）の相性計算
        const osFactor = (char1: string, char2: string) => {
          if (char1 === 'O' && char2 === 'O') return 4;
          if ((char1 === 'O' && char2 === 'S') || (char1 === 'S' && char2 === 'O')) return 2;
          if (char1 === 'S' && char2 === 'S') return 0;
          return 0;
        };
        
        // 各因子のスコアを計算して合計
        try {
          totalScore += eiFactor(user1Character.results.alphabet[0], user2Character.results.alphabet[0]);
          totalScore += ahFactor(user1Character.results.alphabet[1], user2Character.results.alphabet[1]);
          totalScore += crFactor(user1Character.results.alphabet[2], user2Character.results.alphabet[2]);
          totalScore += ntFactor(user1Character.results.alphabet[3], user2Character.results.alphabet[3]);
          totalScore += osFactor(user1Character.results.alphabet[4], user2Character.results.alphabet[4]);
        } catch (e) {
          console.error('Error calculating individual factors:', e);
          console.error('Character data:', {
            user1Alphabet: user1Character.results.alphabet,
            user2Alphabet: user2Character.results.alphabet
          });
          return 0;
        }
        
        return totalScore;

      } catch (error) {
        console.error('Compatibility calculation error:', error);
        return 0;
      }
    };

    // 飲み方の相性を計算する関数
    const calculateDrinkingCompatibility = (
      currentUserDrinking: Record<string, any>,
      targetUserDrinking: Record<string, any>
    ): number => {
      let totalScore = 0;

      let logData = {
        currentUser: currentUserDrinking,
        targetUser: targetUserDrinking,
        ideal_drinking_time: 0,
        drinking_amount: 0,
        drinking_frequency: 0,
        food_pairing_importance: 0,
        alcohol_quality_preference: 0,
        party_drink_preference: 0
      }

      // 1. ideal_drinking_time（1つ離れごとに-2点）
      const timeDiff = Math.abs(currentUserDrinking.ideal_drinking_time - targetUserDrinking.ideal_drinking_time);
      const timeScore = Math.max(10 - (timeDiff * 2), 0);
      totalScore += timeScore;
      logData.ideal_drinking_time = timeScore;


      // 2. drinking_amount（1つズレは減点なし、2つ以上でズレ×-2点）
      const amountDiff = Math.abs(currentUserDrinking.drinking_amount - targetUserDrinking.drinking_amount);
      const amountScore = amountDiff <= 1 ? 10 : Math.max(10 - ((amountDiff - 1) * 2), 0);
      totalScore += amountScore;
      logData.drinking_amount = amountScore;

      // 3. drinking_frequency（1つ離れごとに-2点）
      const freqDiff = Math.abs(currentUserDrinking.drinking_frequency - targetUserDrinking.drinking_frequency);
      let freqScore = 10;
      if ((currentUserDrinking.drinking_frequency === 4 && targetUserDrinking.drinking_frequency === 5) ||
          (currentUserDrinking.drinking_frequency === 5 && targetUserDrinking.drinking_frequency === 4)) {
        freqScore = 10;
      } else {
        freqScore = Math.max(10 - (freqDiff * 2), 0);
      }
      totalScore += freqScore;
      logData.drinking_frequency = freqScore;

      // 4. food_pairing_importance（1つズレは減点なし、2つ以上でズレ×-2点）
      const foodDiff = Math.abs(currentUserDrinking.food_pairing_importance - targetUserDrinking.food_pairing_importance);
      const foodScore = foodDiff <= 1 ? 10 : Math.max(10 - ((foodDiff - 1) * 2), 0);
      totalScore += foodScore;
      logData.food_pairing_importance = foodScore;

      // 5. alcohol_quality_preference
      const qualityDiff = Math.abs(currentUserDrinking.alcohol_quality_preference - targetUserDrinking.alcohol_quality_preference);
      let qualityScore = 10;
      if ((currentUserDrinking.alcohol_quality_preference === 3 && targetUserDrinking.alcohol_quality_preference === 4) ||
          (currentUserDrinking.alcohol_quality_preference === 4 && targetUserDrinking.alcohol_quality_preference === 3)) {
        qualityScore = Math.max(10 - qualityDiff, 0);
      } else {
        qualityScore = qualityDiff <= 1 ? 10 : Math.max(10 - ((qualityDiff - 1) * 2), 0);
      }
      totalScore += qualityScore;
      logData.alcohol_quality_preference = qualityScore;

      // 6. party_drink_preference
      const partyDiff = Math.abs(currentUserDrinking.party_drink_preference - targetUserDrinking.party_drink_preference);
      let partyScore = 10;
      
      const getGroup = (value: number) => {
        if (value <= 2) return 'A';
        if (value === 3) return 'B';
        return 'B_PRIME';
      };
      
      const group1 = getGroup(currentUserDrinking.party_drink_preference);
      const group2 = getGroup(targetUserDrinking.party_drink_preference);
      
      if (group1 === group2) {
        partyScore = 10;
      } else if ((group1 === 'B' && group2 === 'B_PRIME') || (group1 === 'B_PRIME' && group2 === 'B')) {
        partyScore = 8;
      } else if (group1 === 'A' || group2 === 'A') {
        partyScore = Math.max(6 - (partyDiff * 2), 0);
      }
      totalScore += partyScore;
      logData.party_drink_preference = partyScore;

      return totalScore;
    }

    const calculateDrinkingPreference = (currentUserPreference: Record<string, any>, targetUserPreference: Record<string, any>) => {
      let totalScore = 0;
  
      // 飲酒場所の相性を計算
      const currentLocations = currentUserPreference.drinking_location_prefer || [];
      const targetLocations = targetUserPreference.drinking_location_prefer || [];
      
      // 共通の場所の数を計算
      const commonLocations = currentLocations.filter((loc: string) => targetLocations.includes(loc));
      
      // スコアの計算
      if (commonLocations.length >= 2) {
        totalScore += 10;  // 2件以上の一致
      } else if (commonLocations.length === 1) { 
        totalScore += 5;   // 1件の一致
      }
      // 0件の場合は0点を加算
    
      return totalScore;
    }

    // おすすめユーザーの一覧から自分を除外してIDリストを作成
    const recommendedUserIds = recommendedUsersSnapshot.docs
      .filter(doc => doc.id !== currentUserId)
      .map(doc => doc.id);
    
    // 各おすすめユーザーの性格診断結果を並行して取得
    const recommendedUsersCharacters = await Promise.all(
      recommendedUserIds.map(async (userId) => {
        const characterResult = await characterResultsRef
          .where('userId', '==', userId)
          .limit(1)
          .get();
        const character = characterResult.docs[0]?.data() || null;
        return {
          userId,
          character
        };
      })
    );

    // メインのクエリ処理を修正
    const users = recommendedUsersSnapshot.docs
      .filter(doc => doc.id !== currentUserId)
      .filter(doc => {
        const data = doc.data();
        const targetUserHabit = data.answers?.drinking_habit;
        const targetUserAcceptableHabit = data.answers?.acceptable_drinking_habit;
        console.log("=== ", data.name, " ===")
        console.log("")
        const isCompatible = isDrinkingHabitCompatible(
          currentUserData.docs[0]?.data().answers?.acceptable_drinking_habit,
          currentUserData.docs[0]?.data().answers?.drinking_habit,
          targetUserHabit,
          targetUserAcceptableHabit
        );

        if (!isCompatible) {
          console.log('=== isCompatible ===')
          console.log('currentUserData:', currentUserData.docs[0].data().name);
          console.log('isCompatible:', isCompatible);
        }

        return isCompatible;

      })
      .map((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
        const data = doc.data();
        const userCharacter = recommendedUsersCharacters.find(
          char => char.userId === doc.id
        )?.character || null;

        let totalScore = 0;

        // ユーザー間の相性スコアを計算
        const compatibilityScore = calculateCompatibility(
          currentUserCharacter,
          userCharacter
        );
        totalScore += compatibilityScore;
        // 飲み方の相性スコアを計算

        const drinkingScore = calculateDrinkingCompatibility(
          currentUserDrinking,
          data.answers?.way_of_drinking || {}
        );
        totalScore += drinkingScore;

        const drinkingPreferenceScore = calculateDrinkingPreference(
          currentUserPreference,
          data.answers?.favorite_alcohol || {}
        );
        totalScore += drinkingPreferenceScore;

        return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            characterResult: userCharacter,
            compatibilityScore: totalScore,
        };
    });

    // 相性スコアで降順にソート
    const sortedUsers = users.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    return NextResponse.json(sortedUsers);
  } catch (error) {
    // エラーハンドリングとログ出力
    console.error('API Error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown error type'
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
} 