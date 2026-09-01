import { api, ApiError } from "@/lib/api-client"
import {
  BlogPostOutSchema,
  CmsPageOutSchema,
  PublicPolicyOutSchema,
  type BlogPostOut,
  type CmsPageOut,
  type PublicPolicyOut,
} from "./schema"

export type ListBlogPostsParams = {
  visibility?: "Visible" | "Hidden"
  search?: string
  author?: string
  blog?: string
  skip?: number
  limit?: number
}

function buildQueryString(params: Record<string, string | number | undefined>): string {
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value))
    }
  }
  const query = searchParams.toString()
  return query ? `?${query}` : ""
}

// Public blog content: safe to cache at the edge for a short window.
const BLOG_CACHE = { next: { revalidate: 60, tags: ["blog"] } }

// Public CMS pages / policies: same short edge cache as blogs.
const PAGES_CACHE = { next: { revalidate: 60, tags: ["pages", "policies"] } }

export async function listBlogPosts(params: ListBlogPostsParams = {}): Promise<BlogPostOut[]> {
  try {
    const { visibility, search, author, blog, skip = 0, limit = 50 } = params
    const query = buildQueryString({ visibility, search, author, blog, skip, limit })
    const data = await api.get(`/blog-posts${query}`, { auth: false, ...BLOG_CACHE })
    if (!data || !Array.isArray(data)) return []
    return BlogPostOutSchema.array().parse(data)
  } catch (error) {
    console.warn("Backend API /blog-posts error or unreachable:", error)
    return []
  }
}

export async function getBlogPostByHandle(handle: string): Promise<BlogPostOut | null> {
  // The backend exposes no get-by-handle route, so resolve the post by paging
  // through the public list and matching on the exact handle/slug.
  const target = decodeURIComponent(handle)
  try {
    const pageSize = 200
    for (let skip = 0; skip < 1000; skip += pageSize) {
      const posts = await listBlogPosts({ visibility: "Visible", skip, limit: pageSize })
      if (posts.length === 0) break
      const match = posts.find((p) => p.handle === target)
      if (match) return match
      if (posts.length < pageSize) break
    }
    return null
  } catch (error) {
    console.warn("Backend API /blog-posts error or unreachable:", error)
    return null
  }
}

export async function getPageByHandle(handle: string): Promise<CmsPageOut | null> {
  try {
    const data = await api.get<CmsPageOut>(`/pages/${encodeURIComponent(handle)}`, {
      auth: false,
      ...PAGES_CACHE,
    })
    return CmsPageOutSchema.parse(data)
  } catch (error) {
    console.warn(`Backend API /pages/${handle} error or unreachable:`, error)
    return null
  }
}

// Throwing per-page blog fetch (accepts skip/limit) for sitemap pagination.
// Rethrows on API failure so sitemap generation fails closed instead of
// silently producing a partial sitemap.
export async function fetchBlogPostsThrowing(skip: number, limit: number): Promise<BlogPostOut[]> {
  const query = buildQueryString({ visibility: "Visible", skip, limit })
  const data = await api.get(`/blog-posts${query}`, { auth: false, ...BLOG_CACHE })
  // Fail closed: malformed success responses throw rather than returning [].
  return BlogPostOutSchema.array().parse(data)
}

// Error-preserving CMS page fetch for /pages/[slug]. Distinguishes a genuine
// backend 404 ("page not found" -> resolves to null, i.e. missing) from a
// backend/network outage (rethrown so upstream can render a non-indexable
// "temporarily unavailable" state instead of fabricated SEO content).
// Uses `no-store` to preserve the CMS page's previous always-fresh behavior
// (it was fetched with cache:"no-store" before this SEO work) rather than the
// shared PAGES_CACHE revalidation, which other callers/policies may rely on.
export async function fetchPageByHandle(handle: string): Promise<CmsPageOut | null> {
  const data = await api.get<CmsPageOut>(`/pages/${encodeURIComponent(handle)}`, {
    auth: false,
    cache: "no-store",
  })
  return CmsPageOutSchema.parse(data)
}

// Helper used by /pages/[slug] to classify an ApiError: true means the page is
// genuinely missing (404), false means an outage/unavailable condition.
export function isPageNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404
}

// Classification used by /pages/[slug]. Kept in the content module (rather than
// the route component) so it is unit-testable without Next page plumbing.
// - visible: existing public page -> render + index.
// - hidden: page exists but is non-public -> notFound() + noindex.
// - missing: backend 404 -> notFound() + noindex.
// - unavailable: backend/network outage -> distinct non-indexable page (not a
//   404, and never fabricated SEO content).
export type PageState =
  | { kind: "visible"; page: CmsPageOut }
  | { kind: "missing" }
  | { kind: "hidden" }
  | { kind: "unavailable" }

export async function resolvePageState(slug: string): Promise<PageState> {
  try {
    const page = await fetchPageByHandle(slug)
    if (!page) return { kind: "missing" }
    if (page.visibility === "Hidden") return { kind: "hidden" }
    return { kind: "visible", page }
  } catch (error) {
    if (isPageNotFound(error)) return { kind: "missing" }
    return { kind: "unavailable" }
  }
}

export async function listPublicPolicies(): Promise<PublicPolicyOut[]> {
  try {
    const data = await api.get<unknown>("/settings/legal-privacy/public/policies", {
      auth: false,
      ...PAGES_CACHE,
    })
    if (!data || !Array.isArray(data)) return []
    return PublicPolicyOutSchema.array().parse(data)
  } catch (error) {
    console.warn(
      "Backend API /settings/legal-privacy/public/policies error or unreachable:",
      error,
    )
    return []
  }
}

/**
 * Resolve a storefront policy page body from the same database the admin edits.
 * Primary source: Settings -> Policies & Privacy (`store_policies` rows).
 * Fallback: Online Stores -> Pages CMS page with a matching handle.
 */
export async function getPolicyPageContent(
  policyType: "privacy_policy" | "refund_policy" | "terms_of_service",
  pageHandle: string,
): Promise<{ title: string | null; content: string }> {
  const policies = await listPublicPolicies()
  const policy = policies.find((p) => p.policy_type === policyType)
  if (policy?.content) {
    return { title: policy.title, content: policy.content }
  }

  const page = await getPageByHandle(pageHandle)
  if (page && page.visibility !== "Hidden" && page.content) {
    return { title: page.title, content: page.content }
  }

  return { title: null, content: "" }
}
