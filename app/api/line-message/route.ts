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
    const { message, lineUserId } = await request.json()
    console.log('Sending message to:', lineUserId) // デバッグログ

    // @line/bot-sdkのクライアントを使用
    await client.pushMessage(lineUserId, {
      type: 'text',
      text: `新しいメッセージが届きました\n${message}`
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('LINE送信エラー:', error)
    return NextResponse.json(
      { error: 'メッセージの送信に失敗しました' }, 
      { status: 500 }
    )
  }
} 