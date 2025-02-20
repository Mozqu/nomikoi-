'use client'

import type { ReactNode } from "react"
import Header from "./header"
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })

interface LayoutProps {
  children: ReactNode
  noBorder?: boolean
}

export default function Layout({ children, noBorder = false }: LayoutProps) {
  return (
    <div
      className={`min-h-screen bg-cyber-dark text-white ${inter.className} cyberpunk-bg ${
        noBorder ? '' : 'border border-neon-blue/20'
      } rounded-lg pb-16 md:pb-0`}
    >
      <Header />
      <main>{children}</main>
    </div>
  )
}

