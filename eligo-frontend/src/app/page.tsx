import { listProducts } from "@/modules/catalog/api"
import { buildSeoMetadata } from "@/lib/seo"
import { HeroBanner } from "@/components/home/hero-banner"
import { CategoriesSection } from "@/components/home/categories-section"
import { BestSellingSection } from "@/components/home/best-selling-section"
import { SaleBannerSection } from "@/components/home/sale-banner-section"
import { ProductsSection } from "@/components/home/products-section"
import { TestimonialsSection } from "@/components/home/testimonials-section"
import { FaqSection } from "@/components/home/faq-section"
import { NewsletterSection } from "@/components/home/newsletter-section"

export const revalidate = 60

export const metadata = buildSeoMetadata({ title: "Handmade Leather Goods in Pakistan", description: "Discover handcrafted genuine leather wallets, belts, keychains, cases and accessories from Eligo Leather, with secure ordering and nationwide delivery.", path: "/", keywords: ["handcrafted leather Pakistan", "premium leather accessories"] })

interface HomeProductItem {
  id: string | number
  slug: string
  title: string
  category: string
  originalPrice: number
  salePrice: number
  rating: number
  reviewCount: number
  image: string
  secondaryImage?: string
  isSale?: boolean
}

// Ordered so specific product types win over generic words in titles
// (e.g. "Card Holder Wallet" is a wallet, "Keychain Holder" is a keychain).
const PRODUCT_FAMILY_RULES: { family: string; keywords: string[] }[] = [
  {
    family: "Keychains",
    keywords: [
      "keychain",
      "key chain",
      "keyring",
      "key ring",
      "keyfob",
      "key fob",
      "car key",
    ],
  },
  { family: "Belts", keywords: ["belt"] },
  {
    family: "Wallets",
    keywords: ["wallet", "bifold", "trifold", "card holder", "purse"],
  },
  {
    family: "Cases",
    keywords: ["case", "cover", "passport", "eyeglass", "sunglass"],
  },
  { family: "Bags", keywords: ["bag", "tote", "handbag", "backpack"] },
  { family: "Jackets", keywords: ["jacket"] },
  { family: "Shoes", keywords: ["shoe"] },
]

function detectProductFamily(item: HomeProductItem): string {
  const haystack =
    `${item.category} ${item.title}`.toLowerCase()
  for (const rule of PRODUCT_FAMILY_RULES) {
    if (rule.keywords.some((keyword) => haystack.includes(keyword))) {
      return rule.family
    }
  }
  return "Leather Essentials"
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

// At least one random item per available product family, topped up with more
// random products until five slots are filled.
function pickBestSellingItems(items: HomeProductItem[]): HomeProductItem[] {
  const byFamily = new Map<string, HomeProductItem[]>()
  for (const item of items) {
    const family = detectProductFamily(item)
    const bucket = byFamily.get(family)
    if (bucket) {
      bucket.push(item)
    } else {
      byFamily.set(family, [item])
    }
  }

  const pickedIds = new Set<string | number>()
  const bestSelling: HomeProductItem[] = []
  for (const family of shuffle([...byFamily.keys()])) {
    const bucket = byFamily.get(family)!
    const pick = bucket[Math.floor(Math.random() * bucket.length)]
    pickedIds.add(pick.id)
    bestSelling.push(pick)
  }

  const remaining = shuffle(items.filter((item) => !pickedIds.has(item.id)))
  while (bestSelling.length < 5 && remaining.length > 0) {
    bestSelling.push(remaining.pop()!)
  }

  return bestSelling.slice(0, 5)
}

export default async function HomePage() {
  let productsList: HomeProductItem[] = []

  try {
    const rawProducts = await listProducts({ status: "Active", limit: 200 })

    if (Array.isArray(rawProducts)) {
      productsList = rawProducts.map((p) => {
        const sortedImgs = p.images ? [...p.images].sort((a, b) => a.position - b.position) : []
        const primaryImg = sortedImgs[0]?.url || p.image_url || ""
        // Prefer the second pic of the same color variant; fall back to the next product image.
        const primaryTag = sortedImgs[0]?.color_tag || null
        const hoverImg =
          (primaryTag
            ? sortedImgs.find((img, idx) => idx > 0 && img.color_tag === primaryTag)?.url
            : undefined) ||
          sortedImgs[1]?.url ||
          primaryImg
        return {
          id: p.id,
          slug: p.url_handle?.trim() ? p.url_handle : String(p.id),
          title: p.title || "Handmade Leather Product",
          category: p.category || "Leather Essentials",
          originalPrice: p.compare_at_price
            ? parseFloat(p.compare_at_price)
            : Math.round((p.price ? parseFloat(p.price) : 0) * 1.2),
          salePrice: p.price ? parseFloat(p.price) : 0,
          rating: 5.0,
          reviewCount: 35,
          image: primaryImg,
          secondaryImage: hoverImg,
          isSale: Boolean(p.compare_at_price),
        }
      })
    }
  } catch (error) {
    console.error(
      "Could not fetch products from catalog API:",
      error
    )
  }

  return (
    <div>
      {/* 1. Hero Banner */}
      <HeroBanner />

      {/* 2. Our Categories */}
      <CategoriesSection />

      {/* 3. Best Selling Items */}
      <BestSellingSection products={pickBestSellingItems(productsList)} />

      {/* 4. Leather Sale Promotional Banner */}
      <SaleBannerSection />

      {/* 5. Our Products Catalog Section */}
      <ProductsSection initialProducts={productsList} />

      {/* 6. What Our Customers Say */}
      <TestimonialsSection />

      {/* 7. Frequently Asked Questions */}
      <FaqSection />

      {/* 8. Newsletter Deals Subscription */}
      <NewsletterSection />
    </div>
  )
}
