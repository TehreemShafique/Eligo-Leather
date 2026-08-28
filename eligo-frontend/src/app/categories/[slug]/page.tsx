import type { Metadata } from "next"
import { listProducts, listCollections } from "@/modules/catalog/api"
import {
  buildCategoryGroups,
  flattenCategoryGroups,
  isCollectionTypeSlug,
  COLLECTION_TYPE_LABELS,
} from "@/modules/catalog/categories"
import { getCategoryLabel, isCategorySlug, type ProductCategory } from "@/modules/catalog/types"
import { CategoryContent, type CategoryProduct } from "@/components/category/category-content"
import { FaqSection, createCategoryFaqs } from "@/components/home/faq-section"
import { absoluteUrl, buildSeoMetadata } from "@/lib/seo"
import { fetchStoreSchemas } from "@/modules/store/api"
import { fetchAllReviewSummaries } from "@/modules/reviews/api"

type CategoryPageProps = {
  params: Promise<{ slug: string }>
}

// Backend product categories (FastAPI enum) that support direct filtering.
const BACKEND_CATEGORY_ENUMS = ["belts", "wallets", "bags", "jackets", "shoes", "accessories"]

// Subcategory slugs like "bifold-wallets" or "car-key-covers" don't match any
// backend concept anymore; they are resolved with a keyword search so old
// links keep working.
function deriveSearchKeyword(slugValue: string): string | undefined {
  const tokens = slugValue.split("-").filter(Boolean)
  if (tokens.length === 0) return undefined
  const token = tokens.reduce((longest, current) =>
    current.length > longest.length ? current : longest,
  )
  // Plurals ("wallets" -> "wallet") match both singular and plural titles.
  if (/ies$/.test(token) || token.endsWith("ss")) return token
  return token.replace(/s$/, "")
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params

  const collections = await listCollections()
  const matchedCollection = collections.find(
    (c) => c.url_handle?.trim() === slug,
  )

  let titleLabel: string
  if (matchedCollection) {
    titleLabel = matchedCollection.title.trim() || slug
  } else if (isCollectionTypeSlug(slug)) {
    titleLabel = COLLECTION_TYPE_LABELS[slug] ?? slug
  } else if (!isCategorySlug(slug)) {
    return buildSeoMetadata({
      title: "Category Not Found",
      description: "The requested leather product category could not be found. Explore Eligo Leather wallets, belts, cases and accessories.",
      path: `/categories/${slug}`,
      noIndex: true,
    })
  } else {
    titleLabel = getCategoryLabel(slug)
  }

  return buildSeoMetadata({
    title: `${titleLabel} – Handcrafted Leather Collection`,
    description: `Shop handcrafted ${titleLabel.toLowerCase()} from Eligo Leather. Compare genuine leather designs, practical features and prices with delivery across Pakistan.`,
    path: `/categories/${slug}`,
    keywords: [`${titleLabel} Pakistan`, `buy ${titleLabel.toLowerCase()} online`, `genuine leather ${titleLabel.toLowerCase()}`],
  })
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params

  // Admin-created collections drive both this page and its sidebar.
  const collections = await listCollections()
  const sidebarCategories = flattenCategoryGroups(buildCategoryGroups(collections))

  const matchedCollection = collections.find(
    (c) => c.url_handle?.trim() === slug,
  )

  let productsList: CategoryProduct[] = []
  let titleLabel: string
  if (matchedCollection) {
    titleLabel = `All ${matchedCollection.title.trim()} Category`
  } else if (isCollectionTypeSlug(slug)) {
    titleLabel = `All ${COLLECTION_TYPE_LABELS[slug]} Category`
  } else if (isCategorySlug(slug)) {
    titleLabel = `All ${getCategoryLabel(slug)} Category`
  } else {
    titleLabel = `${slug.toUpperCase()} Category`
  }

  // Real review summaries from approved reviews, keyed by product id.
  const reviewSummaries = await fetchAllReviewSummaries()

  try {
    let rawProducts: Awaited<ReturnType<typeof listProducts>> = []

    if (matchedCollection) {
      // Specific admin-created category: strictly its own products
      // (including products of nested sub-categories).
      rawProducts = await listProducts({
        status: "Active",
        collection: matchedCollection.url_handle?.trim() || String(matchedCollection.id),
        limit: 200,
      })
    } else if (isCollectionTypeSlug(slug)) {
      // Collection level ("Wallets"): every admin-created category in it.
      rawProducts = await listProducts({
        status: "Active",
        collection: slug,
        limit: 200,
      })
    } else {
      // Legacy slugs: backend category enum first, keyword search fallback.
      const enumCategory = BACKEND_CATEGORY_ENUMS.includes(slug)
        ? (slug as ProductCategory)
        : undefined
      if (enumCategory) {
        rawProducts = await listProducts({
          status: "Active",
          category: enumCategory,
          limit: 200,
        })
      }
      if (rawProducts.length === 0 && !enumCategory) {
        const keyword = deriveSearchKeyword(slug)
        if (keyword) {
          rawProducts = await listProducts({
            status: "Active",
            search: keyword,
            limit: 200,
          })
        }
      }
    }

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
    console.error("Error fetching category products:", error)
  }

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
              "url": absoluteUrl(`/${p.slug ?? p.id}`),
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

  // A schema published from the admin category editor for THIS category replaces
  // the built-in CollectionPage/Breadcrumb JSON-LD to avoid duplicate markup.
  let publishedSchemaJson: string | null = null
  try {
    const schemas = await fetchStoreSchemas()
    const target = `/categories/${slug}`
    const match = schemas.find(
      (s) => s.is_active && s.schema_type === "collection" && s.target_pages === target,
    )
    if (match && match.schema_json.trim()) {
      publishedSchemaJson = match.schema_json
    }
  } catch {
    publishedSchemaJson = null
  }

  return (
    <>
      {publishedSchemaJson ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: publishedSchemaJson.replace(/</g, "\\u003c") }}
        />
      ) : (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd).replace(/</g, "\\u003c") }}
        />
      )}
      <CategoryContent
        initialProducts={productsList.length > 0 ? productsList : undefined}
        categoryTitle={titleLabel}
        currentSlug={slug}
        sidebarCategories={sidebarCategories}
      />
      <FaqSection
        title={`${getCategoryLabel(slug)} Questions`}
        items={createCategoryFaqs(getCategoryLabel(slug))}
      />
    </>
  )
}
