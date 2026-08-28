import { listProducts, listCollections } from "@/modules/catalog/api"
import {
  buildCategoryGroups,
  flattenCategoryGroups,
} from "@/modules/catalog/categories"
import { buildSeoMetadata } from "@/lib/seo"
import { CategoryContent, type CategoryProduct } from "@/components/category/category-content"
import { CategorySeoSection } from "@/components/category/category-seo-section"
import { FaqSection, PRODUCT_FAQS } from "@/components/home/faq-section"
import { fetchAllReviewSummaries } from "@/modules/reviews/api"

export const metadata = buildSeoMetadata({ title: "Shop Genuine Leather Products Online", description: "Browse genuine leather wallets, belts, keychains, cases and accessories handcrafted for everyday use, gifting and delivery throughout Pakistan.", path: "/products", keywords: ["buy leather products online", "leather wallets Pakistan", "leather accessories Pakistan"] })

export default async function ProductsCatalogPage() {
  let productsList: CategoryProduct[] = []
  let sidebarCategories: Awaited<
    ReturnType<typeof flattenCategoryGroups>
  > = []

  // Real average star ratings + counts from approved reviews (backend).
  const reviewSummaries = await fetchAllReviewSummaries()

  try {
    // Admin-created collections power both this listing and its sidebar.
    const collections = await listCollections()
    sidebarCategories = flattenCategoryGroups(buildCategoryGroups(collections))
  } catch (error) {
    console.error("Could not fetch category tree:", error)
  }

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
        const summary = reviewSummaries[String(p.id)]
        return {
          id: p.id,
          slug: p.url_handle?.trim() ? p.url_handle : String(p.id),
          title: p.title || "Handmade Leather Product",
          originalPrice: p.compare_at_price ? parseFloat(p.compare_at_price) : Math.round((p.price ? parseFloat(p.price) : 0) * 1.2),
          salePrice: p.price ? parseFloat(p.price) : 0,
          rating: summary?.average_rating ?? 0,
          reviewCount: summary?.review_count ?? 0,
          image: primaryImg,
          secondaryImage: hoverImg,
          isSale: Boolean(p.compare_at_price),
        }
      })
    }
  } catch (error) {
    console.error("Could not fetch products from catalog API:", error)
  }

  return (
    <>
    <CategoryContent
      initialProducts={productsList.length > 0 ? productsList : undefined}
      categoryTitle="All Leather Products Catalog"
      currentSlug="all"
      sidebarCategories={sidebarCategories}
      />
      <CategorySeoSection />
      <FaqSection title="Product Questions" items={PRODUCT_FAQS} />
      </>
  )
}
