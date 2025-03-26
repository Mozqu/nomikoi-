import { NextResponse } from 'next/server'
import { adminAuth } from '@/app/firebase/admin'

// 必要な環境変数のチェック
const checkRequiredEnvVars = () => {
  const required = {
    channelId: process.env.NEXT_PUBLIC_LINE_CHANNEL_ID,
    channelSecret: process.env.LINE_CHANNEL_SECRET,
    callbackUrl: process.env.NEXT_PUBLIC_LINE_CALLBACK_URL,
  }

  const missing = Object.entries(required)
    .filter(([_, value]) => !value)
    .map(([key]) => key)

  if (missing.length > 0) {
    throw new Error(`Missing required LINE environment variables: ${missing.join(', ')}`)
  }

  return required
}

export async function POST(request: Request) {
  try {
    const { channelId, channelSecret, callbackUrl } = checkRequiredEnvVars()
    const { code } = await request.json()

    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 })
    }

    // LINEのトークンエンドポイントにリクエスト
    const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: callbackUrl as string,
        client_id: channelId as string,
        client_secret: channelSecret as string,
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      console.error('LINE token error:', errorData)
      throw new Error('Failed to get LINE token')
    }

    const { id_token, access_token } = await tokenResponse.json()

    // LINEプロフィールを取得
    const profileResponse = await fetch('https://api.line.me/v2/profile', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    })

    if (!profileResponse.ok) {
      throw new Error('Failed to get LINE profile')
    }

    const profile = await profileResponse.json()

    // Firebaseカスタムトークンを生成
    const customToken = await adminAuth.createCustomToken(profile.userId, {
      line: {
        userId: profile.userId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl,
      },
    })

    return NextResponse.json({ customToken })
  } catch (error) {
    console.error('LINE authentication error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Authentication failed' },
      { status: 500 }
    )
  }
} 