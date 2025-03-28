import { NextResponse } from 'next/server'
import { Client } from '@line/bot-sdk'
import { adminDb } from '@/app/firebase/admin'

// LINEクライアントの初期化
let client: Client | undefined
try {
  if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) {
    throw new Error('LINE_CHANNEL_ACCESS_TOKEN is not set')
  }
  
  client = new Client({
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
  })
  console.log('LINE client initialized successfully in line-message')
} catch (error) {
  console.error('LINE client initialization error:', error)
}

export async function POST(request: Request) {
  if (!client) {
    console.error('LINE client not initialized')
    return NextResponse.json(
      { error: 'LINE client not initialized' },
      { status: 500 }
    )
  }

  try {
    const body = await request.json()
    console.log('Full request body:', body)  // リクエスト全体をログ出力

    const { message, partnerId, senderName, messageRoomId } = body
    
    // より詳細なバリデーションチェック
    if (!partnerId || typeof partnerId !== 'string') {
      console.error('Invalid partnerId:', partnerId)
      return NextResponse.json(
        { error: 'パートナーIDが無効です', receivedPartnerId: partnerId },
        { status: 400 }
      )
    }

    console.log('Validated partnerId:', partnerId)
    console.log('Message content:', message)
    
    // FirestoreからLINE IDを取得
    const userDoc = await adminDb.collection('users').doc(partnerId).get()
    if (!userDoc.exists) {
      throw new Error('User not found')
    }
    
    const userData = userDoc.data()
    const lineId = userData?.lineId
    
    if (!lineId) {
      throw new Error('LINE ID not found')
    }

    // メッセージが長い場合は省略表示
    const previewMessage = message.length > 30
      ? message.substring(0, 30) + '...' 
      : message
    
    const appUrl = `https://nomikoi.vercel.app/messages/${messageRoomId}`

    const result = await client.pushMessage(lineId, {
      type: 'text',
      text: `${senderName}さんから新しいメッセージ\n\n「${previewMessage}」\n\n▼続きを読む\n${appUrl}`
    })
    
    console.log('Message sent successfully:', result)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('LINE送信エラー:', error)
    return NextResponse.json(
      { error: 'メッセージの送信に失敗しました' }, 
      { status: 500 }
    )
  }
} 