'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="py-4 px-6 flex justify-between items-center">
      <Link href="/" className="text-2xl font-bold text-neon-blue">
        吞恋
      </Link>
      <nav className="hidden md:flex items-center gap-6">
        <Link href="/" className="text-sm font-medium hover:text-primary">
          ホーム
        </Link>
        <Link href="/matching" className="text-sm font-medium hover:text-primary">
          マッチング
        </Link>
        <Link href="/about" className="text-sm font-medium hover:text-primary">
          サービスについて
        </Link>
      </nav>
      <nav>
        <Link href="/signup">
          <Button variant="outline" className="mr-4 text-neon-pink border-neon-pink">
            登録
          </Button>
        </Link>
        <Button className="bg-neon-purple hover:bg-neon-purple/80">ダウンロード</Button>
      </nav>
      <div className="space-y-4">
        <Link
          href="/"
          className="block text-sm font-medium hover:text-primary"
          onClick={() => setIsOpen(false)}
        >
          ホーム
        </Link>
        <Link
          href="/matching"
          className="block text-sm font-medium hover:text-primary"
          onClick={() => setIsOpen(false)}
        >
          マッチング
        </Link>
        <Link
          href="/about"
          className="block text-sm font-medium hover:text-primary"
          onClick={() => setIsOpen(false)}
        >
          サービスについて
        </Link>
      </div>
    </header>
  )
}

