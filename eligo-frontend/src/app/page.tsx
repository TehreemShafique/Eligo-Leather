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

export default async function HomePage() {
  let productsList: HomeProductItem[] = []

  try {
    const rawProducts = await listProducts({ limit: 12 })

    if (Array.isArray(rawProducts)) {
      productsList = rawProducts.map((p) => ({
        id: p.id,
        slug: p.url_handle?.trim() ? p.url_handle : String(p.id),
        title: p.title || "Handmade Leather Product",
        category: p.category || "Leather Essentials",
        originalPrice: p.compare_at_price
          ? parseFloat(p.compare_at_price)
          : Math.round((p.price ? parseFloat(p.price) : 1699) * 1.5),
        salePrice: p.price ? parseFloat(p.price) : 1699,
        rating: 5.0,
        reviewCount: 35,
        image: p.image_url || "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=600",
        secondaryImage: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=600",
        isSale: true,
      }))
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
      <BestSellingSection
        products={
          productsList.length > 0
            ? productsList
            : undefined
        }
      />

      {/* 4. Leather Sale Promotional Banner */}
      <SaleBannerSection />

      {/* 5. Our Products Catalog Section */}
      <ProductsSection
        initialProducts={
          productsList.length > 0
            ? productsList
            : undefined
        }
      />

      {/* 6. What Our Customers Say */}
      <TestimonialsSection />

      {/* 7. Frequently Asked Questions */}
      <FaqSection />

      {/* 8. Newsletter Deals Subscription */}
      <NewsletterSection />
    </div>
  )
}
