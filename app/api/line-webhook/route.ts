import { NextResponse } from 'next/server'
import { Client, validateSignature } from '@line/bot-sdk'
import { headers } from 'next/headers'

// 1. まずパッケージをインストール
// npm install @line/bot-sdk

// 2. LINE Client の初期化
const client = new Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
  channelSecret: process.env.LINE_CHANNEL_SECRET!
})

// GETメソッドも追加
export async function GET() {
  return NextResponse.json({ status: 'ok' })
}

export async function POST(request: Request) {
  try {
    const headersList = headers()
    const signature = headersList.get('x-line-signature')
    const body = await request.text()
    const events = JSON.parse(body).events

    // 署名の検証をスキップ（開発時のデバッグ用）
    // if (!signature || !validateSignature(body, process.env.LINE_CHANNEL_SECRET!, signature)) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    // }

    console.log('Received events:', events) // デバッグ用ログ

    for (const event of events) {
      if (event.type === 'follow') {
        const lineUserId = event.source.userId
        console.log('Follow event from user:', lineUserId) // デバッグ用ログ

        const appUrl = `${process.env.NEXT_PUBLIC_APP_URL}/settings/line-connect?lineUserId=${lineUserId}`

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

    // 成功時も必ず200を返す
    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('Webhook error:', error)
    // エラー時も必ず200を返す
    return new Response('OK', { status: 200 })
  }
} 