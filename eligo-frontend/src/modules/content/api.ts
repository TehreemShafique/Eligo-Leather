import { api } from "@/lib/api-client"
import { BlogPostOutSchema, type BlogPostOut } from "./schema"

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
  try {
    const posts = await listBlogPosts({ search: handle, visibility: "Visible", limit: 10 })
    const match = posts.find((p) => p.handle === handle)
    return match || null
  } catch (error) {
    console.warn("Backend API /blog-posts error or unreachable:", error)
    return null
  }
}
