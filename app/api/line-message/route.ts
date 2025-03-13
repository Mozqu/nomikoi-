import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { message, lineUserId } = await request.json()

    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        to: lineUserId,
        messages: [{
          type: 'text',
          text: `新しいメッセージが届きました\n${message}`
        }]
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(JSON.stringify(errorData))
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('LINE送信エラー:', error)
    return NextResponse.json(
      { error: 'メッセージの送信に失敗しました' }, 
      { status: 500 }
    )
  }
} 