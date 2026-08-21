import { buildRatingMap } from "@/modules/reviews/api"

export interface MappedProduct {
  id: string | number
  slug: string
  title: string
  originalPrice: number
  salePrice: number
  rating: number
  reviewCount: number
  image: string
  secondaryImage?: string
  isSale: boolean
}

const FALLBACK_IMAGE = "/images/homepage/26_rectangle_1682.webp"

interface RawCatalogProduct {
  id: number
  title?: string | null
  price?: string | null
  compare_at_price?: string | null
  image_url?: string | null
  url_handle?: string | null
}

// Maps backend ProductListOut rows into the storefront card shape, using real
// approved-review aggregates for the rating/review-count figures.
export function mapCatalogProducts(
  rawProducts: RawCatalogProduct[],
  approvedReviews: Parameters<typeof buildRatingMap>[0],
): MappedProduct[] {
  const ratingsByProduct = buildRatingMap(approvedReviews)

  return rawProducts.map((p) => {
    const salePrice = p.price ? parseFloat(p.price) : 1699
    const originalPrice = p.compare_at_price
      ? parseFloat(p.compare_at_price)
      : salePrice
    const ratingInfo = ratingsByProduct.get(String(p.id))

    return {
      id: p.id,
      slug: p.url_handle?.trim() ? p.url_handle : String(p.id),
      title: p.title || "Handmade Leather Product",
      originalPrice,
      salePrice,
      rating: ratingInfo?.rating ?? 5.0,
      reviewCount: ratingInfo?.count ?? 0,
      image: p.image_url || FALLBACK_IMAGE,
      isSale: originalPrice > salePrice,
    }
  })
}
