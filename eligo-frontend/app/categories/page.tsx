import { listProducts } from "@/modules/catalog/api"
import { CategoryContent } from "@/components/category/category-content"

export default async function CategoriesPage() {
  let productsList: any[] = []

  try {
    const rawProducts = await listProducts({ limit: 24 })
    if (Array.isArray(rawProducts)) {
      productsList = rawProducts.map((p: any) => ({
        id: p.id,
        title: p.title || p.name || "Handmade Leather Product",
        originalPrice: p.compareAtPrice || Math.round((p.price || 1699) * 1.5),
        salePrice: p.price || 1699,
        rating: p.rating || 5.0,
        reviewCount: p.reviewCount || 35,
        image: p.imageUrl || p.images?.[0] || "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=600",
        isSale: true,
      }))
    }
  } catch (error) {
    console.error("Could not fetch products from catalog API:", error)
  }

  return (
    <CategoryContent
      initialProducts={productsList.length > 0 ? productsList : undefined}
      categoryTitle="All Wallets Category"
    />
  )
}
