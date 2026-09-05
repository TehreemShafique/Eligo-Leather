import type { MetadataRoute } from "next"
import { fetchProductsThrowing, fetchCollectionsThrowing, listSitemapCollectionHandles } from "@/modules/catalog/api"
import { fetchBlogPostsThrowing } from "@/modules/content/api"
import { PRODUCT_CATEGORIES } from "@/modules/catalog/types"
import { absoluteUrl } from "@/lib/seo"
import type { ProductListOut, CollectionOut } from "@/modules/catalog/schema"
import type { BlogPostOut } from "@/modules/content/schema"

// The sitemap reflects live product/collection/blog data, so it is rendered at
// request time rather than baked at build time. This decouples `next build`
// from backend availability while keeping the fail-closed behavior: if the API
// is unreachable at request time, sitemap generation throws instead of emitting
// a partial/empty sitemap.
//
// Note: `force-dynamic` (not `revalidate`/ISR) is required here. In Next 16,
// a metadata route with `export const revalidate` is still prerendered during
// `next build`, which fails when the backend is down. Only `force-dynamic`
// avoids the build-time backend requirement while preserving runtime fail-closed
// generation. For this store the sitemap is low-traffic, so request-time
// rendering is acceptable and keeps the sitemap fresh.
export const dynamic = "force-dynamic"

const PAGE_SIZE = 200

// Paginate a throwing fetcher until a batch returns fewer than PAGE_SIZE rows
// (i.e. the end of the dataset). These helpers throw on API failure so a
// backend outage fails sitemap generation instead of silently producing a
// partial sitemap.
async function fetchAllProducts(): Promise<ProductListOut[]> {
  const all: ProductListOut[] = []
  for (let skip = 0; ; skip += PAGE_SIZE) {
    const batch = await fetchProductsThrowing({ status: "Active", skip, limit: PAGE_SIZE })
    all.push(...batch)
    if (batch.length < PAGE_SIZE) break
  }
  return all
}

async function fetchAllBlogPosts(): Promise<BlogPostOut[]> {
  const all: BlogPostOut[] = []
  for (let skip = 0; ; skip += PAGE_SIZE) {
    const batch = await fetchBlogPostsThrowing(skip, PAGE_SIZE)
    all.push(...batch)
    if (batch.length < PAGE_SIZE) break
  }
  return all
}

async function fetchAllCollections(): Promise<CollectionOut[]> {
  const all: CollectionOut[] = []
  for (let skip = 0; ; skip += PAGE_SIZE) {
    const batch = await fetchCollectionsThrowing(skip, PAGE_SIZE)
    all.push(...batch)
    if (batch.length < PAGE_SIZE) break
  }
  return all
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const staticRoutes = [
    { path: "/", priority: 1, changeFrequency: "daily" as const },
    { path: "/products", priority: 0.9, changeFrequency: "daily" as const },
    { path: "/categories", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/blog", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/contact", priority: 0.6, changeFrequency: "monthly" as const },
    { path: "/sales", priority: 0.7, changeFrequency: "weekly" as const },
    { path: "/privacy-policy", priority: 0.3, changeFrequency: "yearly" as const },
    { path: "/refund-policy", priority: 0.4, changeFrequency: "yearly" as const },
    { path: "/terms-of-service", priority: 0.3, changeFrequency: "yearly" as const },
    { path: "/about", priority: 0.5, changeFrequency: "yearly" as const },
  ]

  // All three fetchers throw on backend failure so an outage surfaces as a
  // sitemap generation error rather than a silently truncated sitemap.
  const [products, posts, collections] = await Promise.all([
    fetchAllProducts(),
    fetchAllBlogPosts(),
    fetchAllCollections(),
  ])

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))

  const categoryEntries: MetadataRoute.Sitemap = PRODUCT_CATEGORIES.map((category) => ({
    url: absoluteUrl(`/categories/${category.value}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }))

  // Top-level admin-created collections with a real url_handle that are not
  // already represented by a hardcoded predefined category URL (deduped by the
  // shared pure helper).
  const predefinedHandles = new Set(PRODUCT_CATEGORIES.map((c) => c.value))
  const collectionEntries: MetadataRoute.Sitemap = listSitemapCollectionHandles(
    collections,
    predefinedHandles,
  ).map(({ handle, updatedAt }) => ({
    url: absoluteUrl(`/categories/${handle}`),
    lastModified: updatedAt ? new Date(updatedAt) : now,
    changeFrequency: "weekly",
    priority: 0.7,
  }))

  const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: absoluteUrl(`/${product.url_handle?.trim() || product.id}`),
    lastModified: product.updated_at ? new Date(product.updated_at) : now,
    changeFrequency: "weekly",
    priority: 0.8,
    images: product.image_url ? [product.image_url] : undefined,
  }))

  const blogEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: absoluteUrl(`/blog/${post.handle}`),
    lastModified: new Date(post.updated_at || post.published_at || post.created_at),
    changeFrequency: "monthly",
    priority: 0.7,
    images: post.featured_image_url ? [post.featured_image_url] : undefined,
  }))

  return [
    ...staticEntries,
    ...categoryEntries,
    ...collectionEntries,
    ...productEntries,
    ...blogEntries,
  ]
}
