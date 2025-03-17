// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 保護するパスのリスト
const protectedPaths = [
  '/dashboard',
  '/settings',
  '/messages',
  '/profile',
]

export async function middleware(request: NextRequest) {
    console.log('==== middleware ====')
  const session = request.cookies.get('session')?.value
  const pathname = request.nextUrl.pathname

  // 保護されたパスかどうかをチェック
  const isProtectedPath = protectedPaths.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  )

  // 保護されたパスでない場合は、そのまま次へ
  if (!isProtectedPath) {
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
     * 以下のパスにマッチする場合にミドルウェアを実行:
     * - /dashboard, /dashboard/任意のパス
     * - /settings, /settings/任意のパス
     * など
     */
    '/dashboard/:path*',
    '/settings/:path*',
    '/messages/:path*',
    '/profile/:path*',
  ],
}