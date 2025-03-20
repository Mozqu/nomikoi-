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

type Answer = {
  question: string;
  answer: string;
  factor: string;
  type: string;
  value: number;
};

type AnswersData = {
  [key: string]: Answer;
};

// factorごとの同点時の優先タイプを定義
const factorPriorities = {
  'E/I': 'I',
  'A/H': 'H',
  'C/R': 'C',
  'N/T': 'N',
  'O/S': 'O'
} as const;

const characterNames = {
    "EAC": {value: "調和者", description: "ムードづくり上手で気配りができる、頼れるまとめ役。"},
    "EHC": {value: "指揮者", description: "周囲を引っ張ることができて、考える力もある、頼れるリーダー役。"},
    "EAR": {value: "情熱家", description: "ノリと勢いで場を温める、明るく柔軟なムード派。"},
    "EHR": {value: "革命家", description: "場をかき回すエンタメ系、自分らしさ全開の爆発型。"},
    "IAC": {value: "守護者", description: "静かに場を支える縁の下タイプ、着実で優しい人。"},
    "IHC": {value: "賢者", description: "自分の信念で動く堅実派、影の司令塔タイプ。"},
    "IAR": {value: "癒し役", description: "静かで控えめ、でもその場の空気を柔らかくする存在感。癒しキャラ。"},
    "IHR": {value: "流浪人", description: "一匹狼型、こだわり強めな個性派アーティスト気質。マイペースな表現者。"},
} as const;

const characterModifiers = {
    "NO": {value: "自由な", description: "余裕があり、柔軟で新しいもの好き。自然体で好奇心にあふれた自由人。"},
    "NS": {value: "穏健な", description: "感情にブレがなく、伝統・習慣を大切にする堅実派。安心感の塊。"},
    "TO": {value: "感性の", description: "敏感で感受性豊か、かつ新しいものに興味津々。芸術肌な人。"},
    "TS": {value: "守りの", description: "繊細でこだわり強め。自分の信念とルールはしっかり守る慎重派。"},
} as const;

const characterResultsContainer = {
    'E/I': {'I': 0, 'E': 0},
    'A/H': {'H': 0, 'A': 0},
    'C/R': {'C': 0, 'R': 0},
    'N/T': {'N': 0, 'T': 0},
    'O/S': {'O': 0, 'S': 0}
  
} as const;

export async function POST(request: Request) {
  try {
    const { responseId, userId } = await request.json();

    // レスポンスの取得
    const responseRef = db.collection('character_responses').doc(responseId);
    const responseSnap = await responseRef.get();

    if (!responseSnap.exists) {
      return NextResponse.json({ error: 'Response not found' }, { status: 404 });
    }

    const responseData = responseSnap.data();
    const answers = responseData?.answers;

    // 因子ごとのスコアを計算
    const factorScores = Object.values(answers).reduce((acc, answer) => {
      const { factor, value, type } = answer;
      characterResultsContainer[factor][type] = (characterResultsContainer[factor][type] || 0) + value;


      return characterResultsContainer;
    }, characterResultsContainer);

    const characterType = Object.keys(factorScores).map((key) => {
        const [key1, key2] = key.split('/');
        let characterType = '';
        
        if (factorScores[key][key2] > factorScores[key][key1]) {
            characterType += key2;
        } else if (factorScores[key][key2] == factorScores[key][key1]) {
            characterType += factorPriorities[key];
        } else {
            characterType += key1;
        }
        return characterType;
    }, "");

    console.log(characterType);
    const frontChar = characterType.slice(0, 3).join('');
    const backChar = characterType.slice(3, 5).join('');

    
    const frontCharModifier = characterModifiers[backChar];
    const backCharModifier = characterNames[frontChar];





    const processedResults = {
      factorScores,
      characterType: `${frontCharModifier.value}${backCharModifier.value}`, // 仮の値、実際の計算ロジックは後ほど実装
      description: `${frontCharModifier.description}${backCharModifier.description}`,
      timestamp: new Date(),
    };

    // 結果を保存
    const resultsRef = db.collection('character_results').doc(responseId);
    await resultsRef.set({
      userId,
      results: processedResults,
      processedAt: new Date(),
      status: 'completed'
    });

    // 元のレスポンスのステータスを更新
    await responseRef.update({
      status: 'processed'
    });

    return NextResponse.json({ 
      success: true,
      results: processedResults
    });

  } catch (error) {
    console.error('Character processing error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Processing failed' }, 
      { status: 500 }
    );
  }
} 