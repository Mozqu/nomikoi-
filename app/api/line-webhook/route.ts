import { NextResponse } from 'next/server'
import { Client } from '@line/bot-sdk'

const client = new Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
  channelSecret: process.env.LINE_CHANNEL_SECRET!
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // 友だち追加イベントの処理
    if (body.events[0].type === 'follow') {
      const lineUserId = body.events[0].source.userId

      // アプリのURLを生成（本番環境のURLに変更してください）
      const appUrl = `${process.env.NEXT_PUBLIC_APP_URL}/settings/line-connect?lineUserId=${lineUserId}`

      // ボタン付きメッセージを送信
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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
} 