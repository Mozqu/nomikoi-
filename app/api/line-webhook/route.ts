import { NextResponse } from 'next/server'
import { Client, validateSignature } from '@line/bot-sdk'
import { headers } from 'next/headers'

// 1. まずパッケージをインストール
// npm install @line/bot-sdk

// デバッグ用にトークンの存在を確認
console.log('Access Token exists:', !!process.env.LINE_CHANNEL_ACCESS_TOKEN)
console.log('Secret exists:', !!process.env.LINE_CHANNEL_SECRET)

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
  channelSecret: process.env.LINE_CHANNEL_SECRET!
}

// クライアントの初期化をtry-catchで囲む
let client: Client | undefined
try {
  if (!process.env.LINE_CHANNEL_ACCESS_TOKEN || !process.env.LINE_CHANNEL_SECRET) {
    throw new Error(`環境変数が未設定です:
      LINE_CHANNEL_ACCESS_TOKEN: ${!!process.env.LINE_CHANNEL_ACCESS_TOKEN}
      LINE_CHANNEL_SECRET: ${!!process.env.LINE_CHANNEL_SECRET}
    `)
  }
  
  client = new Client({
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.LINE_CHANNEL_SECRET
  })
  console.log('LINE client initialized successfully')
} catch (error) {
  console.error('LINE client initialization error:', error)
}

// GETメソッドも追加
export async function GET() {
  return NextResponse.json({ status: 'ok' })
}

export async function POST(request: Request) {
  if (!client) {
    console.error('LINE client not initialized')
    return new Response('OK', { status: 200 })
  }

  try {
    const headersList = await headers()
    const signature = headersList.get('x-line-signature')
    const body = await request.text()

    // 署名検証
    if (!signature || !validateSignature(body, process.env.LINE_CHANNEL_SECRET!, signature)) {
      console.error('Invalid signature')
      return new Response('OK', { status: 200 })
    }

    const events = JSON.parse(body).events
    console.log('Received events:', events) // デバッグ用ログ

    for (const event of events) {
      if (event.type === 'follow') {
        const lineUserId = event.source.userId
        console.log('Follow event from user:', lineUserId)

        const appUrl = `https://nomikoi.vercel.app/settings/line-connect?lineUserId=${lineUserId}`
        console.log('Generated URL:', appUrl) // デバッグ用

        
        await client.pushMessage(lineUserId, {
          type: 'flex',
          altText: 'アカウント連携',
          contents: {
            type: 'bubble',
            body: {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'text',
                  text: 'アカウント連携',
                  weight: 'bold',
                  size: 'xl'
                },
                {
                  type: 'text',
                  text: 'メッセージ通知を受け取るには、アカウントを連携してください',
                  wrap: true,
                  margin: 'md'
                }
              ]
            },
            footer: {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'button',
                  style: 'primary',
                  action: {
                    type: 'uri',
                    label: '連携する',
                    uri: appUrl
                  }
                }
              ]
            }
          }
        })
      }
    }

    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response('OK', { status: 200 })
  }
} 