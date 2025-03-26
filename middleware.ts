// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 保護しないパスのリスト
const publicPaths = [
  '/',
  '/login',
  '/signup',
  '/api/login',
  '/api/logout',
]

// 登録フローのパスとその条件
const registrationPaths = {
  '/register': { field: 'profileCompleted', value: false },
  '/register/way_of_drinking': { field: 'wayOfDrinkingCompleted', value: false },
  '/register/favorite_alcohol': { field: 'favoriteAlcoholCompleted', value: false },
}

// 認証が必要なパス
const authRequiredPaths = [
  '/profile',
  '/settings',
  '/chat',
]

// 認証済みユーザーがアクセスできないパス
const publicOnlyPaths = [
  '/login',
  '/signup',
]

// 認証処理中のパス（特別な処理が必要）
const authProcessingPaths = [
  '/auth/verify',
]

// 認証をスキップするパス
const skipAuthPaths = [
  '/auth/verify',  // 認証処理中
  '/login',        // ログインページ
  '/signup',       // サインアップ
  '/',            // トップページ
  '/api/auth',    // 認証関連API
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // LINE認証コールバックとエラーページはスキップ
  if (
    request.nextUrl.pathname.startsWith('/api/auth/line/callback') ||
    request.nextUrl.pathname.startsWith('/auth/error') ||
    request.nextUrl.pathname.startsWith('/register/caution')
  ) {
    return NextResponse.next();
  }

  // 明示的に除外する（保険）
  if (pathname === "/login" || pathname === "/signup") {
    console.log("保険")
    return NextResponse.next();
  }

  // 保護しないパスかどうかをチェック
  const isPublicPath = publicPaths.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  )

  // 保護しないパスの場合は、そのまま次へ
  if (isPublicPath) {
    console.log('Public path accessed:', pathname)
    return NextResponse.next()
  }

  // 認証スキップのチェック
  if (skipAuthPaths.some(path => pathname.startsWith(path))) {
    console.log('Skipping auth check for:', pathname);
    return NextResponse.next()
  }

  // セッションCookieの確認
  const hasSession = request.cookies.has('session')

  console.log('Middleware check:', {
    path: pathname,
    hasSession,
    timestamp: new Date().toISOString()
  })

  if (!hasSession) {
    console.log('No session found, redirecting to login', {
      path: pathname,
      timestamp: new Date().toISOString()
    })
    const url = new URL('/login', request.url)
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  // セッションの基本的な形式チェックのみを行う
  if (!request.cookies.get('session')?.value.includes('.')) {
    console.log('Invalid session format, redirecting to login')
    const url = new URL('/login', request.url)
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  // 認証処理中のパスは常に許可
  if (authProcessingPaths.some(path => pathname.startsWith(path))) {
    console.log('Auth processing path accessed:', pathname);
    return NextResponse.next()
  }

  // 認証が必要なパスへのアクセスチェック
  if (authRequiredPaths.some(path => pathname.startsWith(path))) {
    if (!hasSession) {
      console.log('No session found, redirecting to login')
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

// ミドルウェアを適用するパスを設定
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}