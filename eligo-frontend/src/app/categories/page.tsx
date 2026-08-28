import { listProducts } from "@/modules/catalog/api"
import { buildSeoMetadata } from "@/lib/seo"
import {
  CategoryContent,
  type CategoryProduct,
} from "@/components/category/category-content"
import { CategorySeoSection } from "@/components/category/category-seo-section"
import { FaqSection, createCategoryFaqs } from "@/components/home/faq-section"
import { fetchAllReviewSummaries } from "@/modules/reviews/api"

export const metadata = buildSeoMetadata({ title: "Leather Product Categories", description: "Explore Eligo Leather product categories including wallets, belts, keychains, cases, bags and handcrafted leather accessories available across Pakistan.", path: "/categories", keywords: ["leather product categories", "wallets belts and accessories"] })

interface CatalogApiProduct {
  id: string | number
  title?: string
  name?: string
  compareAtPrice?: number
  price?: number
  rating?: number
  reviewCount?: number
  imageUrl?: string
  images?: Array<string | { url?: string }>
  secondaryImage?: string
  subcategoryId?: string
}

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=700",
  "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=700",
  "https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&q=80&w=700",
  "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=700",
] as const

function getFirstImage(product: CatalogApiProduct, index: number) {
  const firstImage = product.images?.[0]

  if (typeof product.imageUrl === "string") return product.imageUrl
  if (typeof firstImage === "string") return firstImage
  if (firstImage && typeof firstImage.url === "string") return firstImage.url

  return FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]!
}

export default async function ProductsCatalogPage() {
  let productsList: CategoryProduct[] = []

  // Real average star ratings + counts from approved reviews (backend).
  const reviewSummaries = await fetchAllReviewSummaries()

  try {
    const rawProducts = (await listProducts({ limit: 24 })) as unknown

    if (Array.isArray(rawProducts)) {
      productsList = (rawProducts as CatalogApiProduct[]).map(
        (product, index) => {
          const salePrice = product.price || 1699
          const originalPrice =
            product.compareAtPrice || Math.round(salePrice * 1.5)
          const summary = reviewSummaries[String(product.id)]

          return {
            id: product.id,
            title:
              product.title || product.name || "Handmade Leather Product",
            originalPrice,
            salePrice,
            rating: summary?.average_rating ?? 0,
            reviewCount: summary?.review_count ?? 0,
            image: getFirstImage(product, index),
            secondaryImage:
              product.secondaryImage ||
              FALLBACK_IMAGES[(index + 1) % FALLBACK_IMAGES.length]!,
            isSale: originalPrice > salePrice,
            subcategoryId: product.subcategoryId,
          }
        },
      )
    }
  } catch (error) {
    console.error("Could not fetch products from catalog API:", error)
  }

  return (
    <>
    <CategoryContent
      initialProducts={productsList.length ? productsList : undefined}
      categoryTitle="All Leather Products Catalog"
      />
    <CategorySeoSection />
    <FaqSection title="Category Questions" items={createCategoryFaqs("Leather Products")} />
      </>
  )
}