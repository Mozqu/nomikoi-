import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/app/firebase/config'
import { getAuth } from 'firebase-admin/auth'
import { initializeApp, getApps, cert } from 'firebase-admin/app'

// Firebase Adminの初期化
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const session = cookieStore.get('session')?.value

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // セッションからユーザー情報を取得
    const decodedToken = await getAuth().verifySessionCookie(session)
    const userId = decodedToken.uid

    const userDoc = await getDoc(doc(db!, 'users', userId))
    if (!userDoc.exists()) {
      return NextResponse.json({ agreement: false })
    }

    const userData = userDoc.data()
    return NextResponse.json({ agreement: userData.agreement || false })
  } catch (error) {
    console.error('Error checking user registration status:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
} 