import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { cache } from "react"
import { fetchProductsThrowing, listCollectionsAllPages } from "@/modules/catalog/api"
import {
  buildCategoryGroups,
  flattenCategoryGroups,
  isCollectionTypeSlug,
  COLLECTION_TYPE_LABELS,
} from "@/modules/catalog/categories"
import { getCategoryLabel, isCategorySlug, type ProductCategory } from "@/modules/catalog/types"
import type { CollectionOut, ProductListOut } from "@/modules/catalog/schema"
import { CategoryContent, type CategoryProduct } from "@/components/category/category-content"
import { FaqSection, createCategoryFaqs } from "@/components/home/faq-section"
import { absoluteUrl, buildSeoMetadata } from "@/lib/seo"
import { fetchStoreSchemas } from "@/modules/store/api"
import { fetchAllReviewSummaries } from "@/modules/reviews/api"
import { StorefrontUnavailable } from "@/components/storefront-unavailable"

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

// A slug is independently valid (a real predefined category or collection
// type) without needing backend collection resolution. Used so an outage does
// not turn a known-valid route into a false 404.
function isKnownValidCategorySlug(slug: string): boolean {
  return isCollectionTypeSlug(slug) || isCategorySlug(slug) || BACKEND_CATEGORY_ENUMS.includes(slug)
}

// Discord-mediated category state:
// - invalid: collections resolved OK but this slug matches no real category ->
//   genuine 404.
// - unavailable: required data could not be confirmed/loaded (collection or
//   product backend outage) -> distinct noindex page, NOT a 404, never hollow
//   indexable content.
// - valid: collections resolved, this is a real category, and the product fetch
//   succeeded (products may be legitimately empty). Products are resolved here
//   (not in the body alone) so generateMetadata and the page body always agree
//   on available-vs-unavailable.
type CategoryState =
  | { kind: "invalid" }
  | { kind: "unavailable" }
  | {
      kind: "valid"
      collections: CollectionOut[]
      matchedCollection?: CollectionOut
      rawProducts: ProductListOut[]
    }

// Product fetch for a resolved category, using the throwing helper so a fetch
// failure (outage) throws instead of being mistaken for an empty category.
function fetchCategoryRawProducts(
  slug: string,
  matchedCollection?: CollectionOut,
): Promise<ProductListOut[]> {
  if (matchedCollection) {
    return fetchProductsThrowing({
      status: "Active",
      collection: matchedCollection.url_handle?.trim() || String(matchedCollection.id),
      limit: 200,
    })
  }
  if (isCollectionTypeSlug(slug)) {
    return fetchProductsThrowing({ status: "Active", collection: slug, limit: 200 })
  }
  const enumCategory = BACKEND_CATEGORY_ENUMS.includes(slug)
    ? (slug as ProductCategory)
    : undefined
  if (enumCategory) {
    return fetchProductsThrowing({ status: "Active", category: enumCategory, limit: 200 })
  }
  const keyword = deriveSearchKeyword(slug)
  if (keyword) {
    return fetchProductsThrowing({ status: "Active", search: keyword, limit: 200 })
  }
  return Promise.resolve([])
}

// Shared + cached (per-request) category state resolver. Both generateMetadata
// and the page body call this, so they get identical state (invalid /
// unavailable / valid with products) and do not duplicate backend work.
const resolveCategoryState = cache(async (slug: string): Promise<CategoryState> => {
  const collections = await listCollectionsAllPages()
  if (!collections.ok) {
    // Backend/network outage in collections. A known-valid slug is still a real
    // route, but we cannot load its required data, so we show the unavailable/
    // noindex state rather than a hollow indexable page or a false 404.
    return { kind: "unavailable" }
  }

  const data = collections.data
  const matchedCollection = data.find((c) => c.url_handle?.trim() === slug)

  if (!matchedCollection && !isKnownValidCategorySlug(slug)) {
    return { kind: "invalid" }
  }

  // Valid category: resolve products now. If the product fetch fails (outage),
  // mark the whole route unavailable so metadata and body agree on noindex
  // rather than showing indexable metadata over an unavailable body.
  let rawProducts: ProductListOut[]
  try {
    rawProducts = await fetchCategoryRawProducts(slug, matchedCollection)
  } catch (error) {
    console.error("Error fetching category products:", error)
    return { kind: "unavailable" }
  }

  return { kind: "valid", collections: data, matchedCollection, rawProducts }
})

function deriveTitleLabel(slug: string, state: Extract<CategoryState, { kind: "valid" }>): string {
  const { matchedCollection } = state
  if (matchedCollection) return matchedCollection.title.trim() || slug
  if (isCollectionTypeSlug(slug)) return COLLECTION_TYPE_LABELS[slug] ?? slug
  return getCategoryLabel(slug)
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params
  const state = await resolveCategoryState(slug)

  if (state.kind === "invalid" || state.kind === "unavailable") {
    const missing = state.kind === "invalid"
    return buildSeoMetadata({
      title: missing ? "Category Not Found" : "Category Temporarily Unavailable",
      description: missing
        ? "The requested leather product category could not be found. Explore Eligo Leather wallets, belts, cases and accessories."
        : "This Eligo Leather category is temporarily unavailable. Please try again shortly.",
      path: `/categories/${slug}`,
      noIndex: true,
    })
  }

  const titleLabel = deriveTitleLabel(slug, state)

  return buildSeoMetadata({
    title: `${titleLabel} – Handcrafted Leather Collection`,
    description: `Shop handcrafted ${titleLabel.toLowerCase()} from Eligo Leather. Compare genuine leather designs, practical features and prices with delivery across Pakistan.`,
    path: `/categories/${slug}`,
    keywords: [`${titleLabel} Pakistan`, `buy ${titleLabel.toLowerCase()} online`, `genuine leather ${titleLabel.toLowerCase()}`],
  })
}

// Map resolved raw products into the storefront card shape, enriching with real
// review summaries (which are safe and never throw). Runs only in the page body
// (the resolver decides valid/unavailable, so metadata never needs this step).
function mapRawProducts(
  rawProducts: ProductListOut[],
  reviewSummaries: Record<string, { average_rating?: number; review_count?: number }>,
): CategoryProduct[] {
  return rawProducts.map((p) => {
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

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params
  const state = await resolveCategoryState(slug)

  if (state.kind === "invalid") {
    notFound()
  }

  if (state.kind === "unavailable") {
    return <StorefrontUnavailable />
  }

  const titleLabel = deriveTitleLabel(slug, state)
  const sidebarCategories = flattenCategoryGroups(buildCategoryGroups(state.collections))

  // Real review summaries from approved reviews; safe (never throws).
  const reviewSummaries = await fetchAllReviewSummaries()

  const productsList = mapRawProducts(state.rawProducts, reviewSummaries)

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
