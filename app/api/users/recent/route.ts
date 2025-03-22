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
    console.log('==== recent users ====')
    try {
        // URLからクエリパラメータを取得
        const { searchParams } = new URL(request.url);
        const currentUserId = searchParams.get('userId');
        const currentUserGender = searchParams.get('gender');

        if (!currentUserId || !currentUserGender) {
            return NextResponse.json(
                { error: 'User ID and gender are required' },
                { status: 400 }
            );
        }

        // クエリを構築
        const usersRef = db.collection('users');
        const recentUsersQuery = usersRef
            .where('gender', '==', currentUserGender === '女性' ? '男性' : '女性')
            .orderBy('createdAt', 'desc')
            .limit(10);

        console.log('Query parameters:', {
            currentUserId,
            currentUserGender
        });

        const snapshot = await recentUsersQuery.get();

        const users = snapshot.docs
            .filter(doc => doc.id !== currentUserId) // クライアントサイドでフィルタリング
            .map((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
                const data = doc.data();
                return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                };
            });

        console.log('Found users:', users.length);
        return NextResponse.json(users);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal Server Error' },
            { status: 500 }
        );
    }
} 