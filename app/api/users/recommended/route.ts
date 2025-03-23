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

        console.log('Total compatibility score:', totalScore);
        
        return totalScore;

      } catch (error) {
        console.error('Compatibility calculation error:', error);
        return 0;
      }
    };

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
    

    // 最終的なレスポンスデータの構築
    const users = recommendedUsersSnapshot.docs
        .filter(doc => doc.id !== currentUserId)
        .map((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
            const data = doc.data();
            const userCharacter = recommendedUsersCharacters.find(
              char => char.userId === doc.id
            )?.character || null;

            // ユーザー間の相性スコアを計算
            const compatibilityScore = calculateCompatibility(
              currentUserCharacter,
              userCharacter
            );

            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                characterResult: userCharacter,
                compatibilityScore: compatibilityScore
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