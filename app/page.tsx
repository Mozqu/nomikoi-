import Head from "next/head"
import Layout from "../components/layout"
import HeroSection from "@/components/hero-section"
import FeaturesSection from "@/components/features-section"
import CtaSection from "@/components/cta-section"

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

      <HeroSection />
      <FeaturesSection />
      <CtaSection />
    </Layout>
  )
}

