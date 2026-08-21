import { listProducts } from "@/modules/catalog/api"
import { buildSeoMetadata } from "@/lib/seo"
import { CategoryContent, type CategoryProduct } from "@/components/category/category-content"
import { CategorySeoSection } from "@/components/category/category-seo-section"
import { FaqSection, PRODUCT_FAQS } from "@/components/home/faq-section"

export const metadata = buildSeoMetadata({ title: "Shop Genuine Leather Products Online", description: "Browse genuine leather wallets, belts, keychains, cases and accessories handcrafted for everyday use, gifting and delivery throughout Pakistan.", path: "/products", keywords: ["buy leather products online", "leather wallets Pakistan", "leather accessories Pakistan"] })

export default async function ProductsCatalogPage() {
  let productsList: CategoryProduct[] = []

  try {
    const rawProducts = await listProducts({ limit: 24 })
    if (Array.isArray(rawProducts)) {
      productsList = rawProducts.map((p) => ({
        id: p.id,
        slug: p.url_handle?.trim() ? p.url_handle : String(p.id),
        title: p.title || "Handmade Leather Product",
        originalPrice: p.compare_at_price ? parseFloat(p.compare_at_price) : Math.round((p.price ? parseFloat(p.price) : 1699) * 1.5),
        salePrice: p.price ? parseFloat(p.price) : 1699,
        rating: 5.0,
        reviewCount: 35,
        image: p.image_url || "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=600",
        isSale: true,
      }))
    }
  } catch (error) {
    console.error("Could not fetch products from catalog API:", error)
  }

  return (
    <>
    <CategoryContent
      initialProducts={productsList.length > 0 ? productsList : undefined}
      categoryTitle="All Leather Products Catalog"
      />
      <CategorySeoSection />
      <FaqSection title="Product Questions" items={PRODUCT_FAQS} />
      </>
  )
}
