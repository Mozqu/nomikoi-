import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  try {
    // LINEアクセストークンの取得
    const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code!,
        redirect_uri: process.env.LINE_REDIRECT_URI!,
        client_id: process.env.LINE_CLIENT_ID!,
        client_secret: process.env.LINE_CLIENT_SECRET!,
      }),
    })

    const tokenData = await tokenResponse.json()

    // LINEプロフィールの取得
    const profileResponse = await fetch('https://api.line.me/v2/profile', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    })

    const profileData = await profileResponse.json()

    // ユーザーのlineUserIdを保存する処理をここに実装

    return NextResponse.redirect('/settings/line-connect/success')
  } catch (error) {
    console.error('LINE連携エラー:', error)
    return NextResponse.redirect('/settings/line-connect/error')
  }
} 