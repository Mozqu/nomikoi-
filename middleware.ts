import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 認証不要のパス（公開ページ）
const publicPaths = [
  '/',                    // トップページ
  '/login',              // ログインページ
  '/signup',             // サインアップ
  '/api/login',          // ログインAPI
  '/api/signup',         // サインアップAPI
]

// 認証処理中のパス
const authProcessingPaths = [
  '/auth/verify',        // 認証検証
  '/api/auth',           // 認証API
]

export function middleware(request: NextRequest) {
  console.log('=== middleware ===')
  const { pathname } = request.nextUrl

  // 認証処理中のパスはスキップ
  if (authProcessingPaths.some(path => pathname.startsWith(path))) {
    console.log('Auth processing path:', pathname)
    return NextResponse.next()
  }

  // 公開パスはスキップ
  if (publicPaths.some(path => {
    // 完全一致またはサブパスの場合のみマッチ
    return pathname === path || pathname === `${path}/`
  })) {
    console.log('Public path:', pathname)
    return NextResponse.next()
  }

  // 静的ファイルやAPI以外のすべてのパスで認証チェック
  const hasSession = request.cookies.has('session')
  console.log('Auth check:', {
    path: pathname,
    hasSession,
    timestamp: new Date().toISOString()
  })

  if (!hasSession) {
    console.log('No session, redirecting to login')
    const url = new URL('/login', request.url)
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}