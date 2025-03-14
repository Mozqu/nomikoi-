import { NextResponse } from 'next/server'
import { Client } from '@line/bot-sdk'

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
    const { message, lineUserId, senderName, messageRoomId } = await request.json()
    console.log('Sending message to:', lineUserId)
    console.log('Message content:', message)
    
    // メッセージが長い場合は省略表示
    const previewMessage = message.length > 30
      ? message.substring(0, 30) + '...' 
      : message
    
    const appUrl = `https://nomikoi.vercel.app/messages/${messageRoomId}`

    const result = await client.pushMessage(lineUserId, {
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