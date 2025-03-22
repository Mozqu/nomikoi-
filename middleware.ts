// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 保護しないパスのリスト
const publicPaths = [
  '/',
  '/login',
  '/signup',
]

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('session')?.value
  const pathname = request.nextUrl.pathname

  // 保護しないパスかどうかをチェック
  const isPublicPath = publicPaths.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  )

  // 保護しないパスの場合は、そのまま次へ
  if (isPublicPath) {
    return NextResponse.next()
  }

  // セッションがない場合はログインページにリダイレクト
  if (!session) {
    const url = new URL('/login', request.url)
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  // セッションの基本的な形式チェックのみを行う
  // 詳細な検証はページのサーバーコンポーネントで行う
  if (!session.includes('.')) {
    const url = new URL('/login', request.url)
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

// ミドルウェアを適用するパスを設定
export const config = {
  matcher: [
    /*
     * 以下のパス以外の全てのパスにマッチする場合にミドルウェアを実行:
     * - / (ルート)
     * - /login
     * - /signup
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}