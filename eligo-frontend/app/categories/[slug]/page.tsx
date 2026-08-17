import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { listProducts } from "@/modules/catalog/api"
import { getCategoryLabel, isCategorySlug } from "@/modules/catalog/types"
import { CategoryContent } from "@/components/category/category-content"

type CategoryPageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params
  if (!isCategorySlug(slug)) return { title: "Category not found" }
  return { title: `${getCategoryLabel(slug)} | Eligo Leather` }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params

  let productsList: any[] = []
  try {
    const rawProducts = await listProducts({
      status: "Active",
      category: (isCategorySlug(slug) ? slug : undefined) as any,
    })
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
    console.error("Error fetching category products:", error)
  }

  const titleLabel = isCategorySlug(slug)
    ? `All ${getCategoryLabel(slug)} Category`
    : `${slug.toUpperCase()} Category`

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `https://eligoleather.com/categories/${slug}/#collectionpage`,
        "name": titleLabel,
        "url": `https://eligoleather.com/categories/${slug}`,
        "description": `Browse handcrafted top-grain leather goods in ${titleLabel} at Eligo Leather.`,
        "isPartOf": {
          "@type": "WebSite",
          "name": "Eligo Leather Official Store",
          "url": "https://eligoleather.com"
        },
        "mainEntity": {
          "@type": "ItemList",
          "numberOfItems": productsList.length,
          "itemListElement": productsList.map((p, idx) => ({
            "@type": "ListItem",
            "position": idx + 1,
            "item": {
              "@type": "Product",
              "name": p.title,
              "url": `https://eligoleather.com/products/${p.id}`,
              "image": p.image,
            },
          })),
        },
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://eligoleather.com",
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Categories",
            "item": "https://eligoleather.com/categories",
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": titleLabel,
            "item": `https://eligoleather.com/categories/${slug}`,
          },
        ],
      },
      {
        "@type": "Organization",
        "name": "Eligo Leather Official Store",
        "url": "https://eligoleather.com",
        "logo": "https://eligoleather.com/logo.png",
        "sameAs": [
          "https://facebook.com/eligoleather",
          "https://instagram.com/eligoleather"
        ],
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <CategoryContent
        initialProducts={productsList.length > 0 ? productsList : undefined}
        categoryTitle={titleLabel}
      />
    </>
  )
}
