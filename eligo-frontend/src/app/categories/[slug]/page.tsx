import type { Metadata } from "next"
import { listProducts } from "@/modules/catalog/api"
import { getCategoryLabel, isCategorySlug, type ProductCategory } from "@/modules/catalog/types"
import { CategoryContent, type CategoryProduct } from "@/components/category/category-content"
import { FaqSection, createCategoryFaqs } from "@/components/home/faq-section"
import { absoluteUrl, buildSeoMetadata } from "@/lib/seo"

type CategoryPageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params
  if (!isCategorySlug(slug)) {
    return buildSeoMetadata({
      title: "Category Not Found",
      description: "The requested leather product category could not be found. Explore Eligo Leather wallets, belts, cases and accessories.",
      path: `/categories/${slug}`,
      noIndex: true,
    })
  }

  const label = getCategoryLabel(slug)
  return buildSeoMetadata({
    title: `${label} – Handcrafted Leather Collection`,
    description: `Shop handcrafted ${label.toLowerCase()} from Eligo Leather. Compare genuine leather designs, practical features and prices with delivery across Pakistan.`,
    path: `/categories/${slug}`,
    keywords: [`${label} Pakistan`, `buy ${label.toLowerCase()} online`, `genuine leather ${label.toLowerCase()}`],
  })
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params

  let productsList: CategoryProduct[] = []
  try {
    const rawProducts = await listProducts({
      status: "Active",
      category: isCategorySlug(slug) ? (slug as ProductCategory) : undefined,
    })
    if (Array.isArray(rawProducts)) {
      productsList = rawProducts.map((p) => ({
        id: p.id,
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
        "@id": `${absoluteUrl(`/categories/${slug}`)}/#collectionpage`,
        "name": titleLabel,
        "url": absoluteUrl(`/categories/${slug}`),
        "description": `Browse handcrafted top-grain leather goods in ${titleLabel} at Eligo Leather.`,
        "isPartOf": {
          "@type": "WebSite",
          "name": "Eligo Leather Official Store",
          "url": absoluteUrl("/")
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
              "url": absoluteUrl(`/products/${p.id}`),
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
            "item": absoluteUrl("/"),
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Categories",
            "item": absoluteUrl("/categories"),
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": titleLabel,
            "item": absoluteUrl(`/categories/${slug}`),
          },
        ],
      },
      {
        "@type": "Organization",
        "name": "Eligo Leather Official Store",
        "url": absoluteUrl("/"),
        "logo": absoluteUrl("/images/homepage/2_rectangle_1655.webp"),
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd).replace(/</g, "\\u003c") }}
      />
      <CategoryContent
        initialProducts={productsList.length > 0 ? productsList : undefined}
        categoryTitle={titleLabel}
      />
      <FaqSection
        title={`${getCategoryLabel(slug)} Questions`}
        items={createCategoryFaqs(getCategoryLabel(slug))}
      />
    </>
  )
}
