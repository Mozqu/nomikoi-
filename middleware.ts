import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 認証不要のパス（公開ページ）
const publicPaths = [
  '/',                    // トップページ
  '/login',              // ログインページ
  '/signup',             // サインアップ
  '/api/login',          // ログインAPI
  '/api/signup',         // サインアップAPI
  '/adminLogin',         // 管理者ログイン
  '/adminLogin/signup',  // 管理者サインアップ
  '/api/adminLogin',     // 管理者ログインAPI
  '/api/adminSignup'     // 管理者サインアップAPI
]

// 認証処理中のパス
const authProcessingPaths = [
  '/auth/verify',        // 認証検証
  '/api/auth',           // 認証API
]

export function middleware(request: NextRequest) {
  console.log('=== middleware ===')
  const { pathname } = request.nextUrl

  // リクエスト情報のデバッグ出力
  console.log('Request details:', {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    timestamp: new Date().toISOString()
  })

  // セッションクッキーの取得と検証
  const session = request.cookies.get('session')
  const allCookies = request.cookies.getAll()
  console.log('Auth check:', {
    path: pathname,
    hasSession: !!session,
    sessionValue: !!session?.value,
    allCookies: allCookies.map(c => ({ 
      name: c.name,
      value: c.value ? 'exists' : 'empty'
    })),
    timestamp: new Date().toISOString()
  })

  // 開発環境でのIPアクセスの場合は認証をスキップ
  if (process.env.NODE_ENV === 'development' && 
      (request.headers.get('host')?.includes('192.168.') || 
       request.headers.get('host')?.includes('127.0.0.1') ||
       request.headers.get('host')?.includes('[::1]'))) {
    console.log('Development IP access, skipping auth')
    return NextResponse.next()
  }

  // 公開パスはスキップ
  if (publicPaths.some(path => pathname === path || pathname === `${path}/`)) {
    console.log('Public path:', pathname)
    
    // ログイン済みユーザーのリダイレクト処理
    if (session?.value && (pathname === '/login' || pathname === '/signup' || pathname === '/')) {
      console.log('Logged in user accessing public path, redirecting to dashboard')
      const url = new URL('/home', request.url)
      return NextResponse.redirect(url)
    }
    
    return NextResponse.next()
  }

  // 認証処理中のパスはスキップ
  if (authProcessingPaths.some(path => pathname.startsWith(path))) {
    console.log('Auth processing path:', pathname)
    return NextResponse.next()
  }

  // APIリクエストの処理（セッション関連以外）
  if (pathname.startsWith('/api/') && 
      !pathname.includes('/api/auth/') && 
      !pathname.includes('/api/login')) {
    console.log('API path:', pathname)
    return NextResponse.next()
  }

  if (!session?.value) {
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