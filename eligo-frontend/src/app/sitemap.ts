import type { MetadataRoute } from "next"
import { listProducts } from "@/modules/catalog/api"
import { listBlogPosts } from "@/modules/content/api"
import { PRODUCT_CATEGORIES } from "@/modules/catalog/types"
import { absoluteUrl } from "@/lib/seo"

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

  // Backend list endpoints cap `limit` at 200.
  const [products, posts] = await Promise.all([
    listProducts({ status: "Active", limit: 200 }),
    listBlogPosts({ visibility: "Visible", limit: 200 }),
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

  return [...staticEntries, ...categoryEntries, ...productEntries, ...blogEntries]
}