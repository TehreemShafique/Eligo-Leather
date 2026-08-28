import type { Metadata } from "next"
import { env } from "@/lib/env"

export const SITE_NAME = "Eligo Leather"
export const SITE_URL = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")
export const DEFAULT_DESCRIPTION =
  "Shop handcrafted genuine leather wallets, belts, keychains, cases and accessories from Eligo Leather, with secure ordering and delivery across Pakistan."
export const DEFAULT_OG_IMAGE = "/images/blog_hero.webp"
export const DEFAULT_KEYWORDS = [
  "Eligo Leather",
  "leather goods Pakistan",
  "genuine leather products",
  "handmade leather wallets",
  "leather belts Pakistan",
  "leather accessories",
  "online leather store Pakistan",
]

interface SeoMetadataOptions {
  title: string
  description: string
  path: string
  image?: string
  keywords?: string[]
  noIndex?: boolean
  type?: "website" | "article"
  canonical?: string
}

export function absoluteUrl(path = "/") {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`
}

export function buildSeoMetadata({
  title,
  description,
  path,
  image = DEFAULT_OG_IMAGE,
  keywords = [],
  noIndex = false,
  type = "website",
  canonical,
}: SeoMetadataOptions): Metadata {
  const canonicalUrl = canonical ? canonical : absoluteUrl(path)
  const socialImage = absoluteUrl(image)

  return {
    title,
    description,
    keywords: [...new Set([...DEFAULT_KEYWORDS, ...keywords])],
    authors: [{ name: SITE_NAME, url: SITE_URL }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    alternates: { canonical: canonicalUrl },
    robots: {
      index: !noIndex,
      follow: true,
      googleBot: {
        index: !noIndex,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      type,
      locale: "en_PK",
      url: canonical,
      siteName: SITE_NAME,
      title,
      description,
      images: [{ url: socialImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialImage],
    },
  }
}