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
    const { searchParams } = new URL(request.url);
    const currentUserId = searchParams.get('userId');
    const currentUserGender = searchParams.get('gender');

    if (!currentUserId || !currentUserGender) {
      return NextResponse.json(
        { error: 'User ID and gender are required' },
        { status: 400 }
      );
    }

    // おすすめユーザーのクエリを構築
    const usersRef = db.collection('users');
    const recommendedUsersQuery = usersRef
      .where('gender', '==', currentUserGender === '女性' ? '男性' : '女性')
      .orderBy('createdAt', 'desc')
      .limit(50);

    const snapshot = await recommendedUsersQuery.get();

    console.log('==== recommended users ====')

    console.log(snapshot.docs.length)

    const users = snapshot.docs
        .filter(doc => doc.id !== currentUserId)
        .map((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
            const data = doc.data();

            console.log(data)

            

            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            };
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
} 