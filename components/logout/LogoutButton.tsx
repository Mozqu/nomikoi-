// components/LogoutButton.tsx
'use client'

import { signOut } from 'firebase/auth'
import { auth } from '@/app/firebase/config'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()
  
  const handleLogout = async () => {
    try {
      // Firebaseからログアウト
      await signOut(auth)
      
      // セッションクッキーを削除
      await fetch('/api/logout', {
        method: 'POST',
      })
      
      // ログインページにリダイレクト
      router.push('/login')
    } catch (error) {
      console.error('ログアウトエラー:', error)
    }
  }
  
  return (
    <button
      onClick={handleLogout}
      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
    >
      ログアウト
    </button>
  )
}