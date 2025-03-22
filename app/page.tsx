import Head from "next/head"
import Layout from "../components/layout"
import HeroSection from "@/components/hero-section"
import FeaturesSection from "@/components/features-section"
import CtaSection from "@/components/cta-section"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import Link from "next/link"


export default function Home() {
  return (
    <Layout noBorder>
      <Head>
        <title>吞恋 - 飲みたい気分でマッチング</title>
        <meta name="description" content="あなたの飲みたい気分や目的に合わせて、最適な飲み友達をマッチングするアプリ" />
        <meta property="og:title" content="吞恋 - 飲みたい気分でマッチング" />
        <meta
          property="og:description"
          content="あなたの飲みたい気分や目的に合わせて、最適な飲み友達をマッチングするアプリ"
        />
        <meta property="og:image" content="/og-image.jpg" />
        <meta property="og:url" content="https://nomiren.com" />
        <meta property="og:type" content="website" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      
      <div className="flex space-y-2 flex-col items-center justify-center h-screen">
        <div className="m-4 flex flex-col space-y-2">
          <Image src="https://firebasestorage.googleapis.com/v0/b/nomikoi.firebasestorage.app/o/main-logo.png?alt=media&token=e49c1c2a-795b-4ffc-bbad-b4caae39e3e8" alt="吞恋" width={300} height={300} />
          <Button
            className="w-full rounded-full neon-bg">
            <Link href="/signup">新しく始める</Link>
          </Button>
          <Button variant="outline" className="w-full rounded-full">
            <Link href="/login">既に登録されている方</Link>
          </Button>
        </div>
      </div>

      
    </Layout>
  )
}

