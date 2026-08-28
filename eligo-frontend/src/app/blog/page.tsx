import { listBlogPosts } from "@/modules/content/api"
import type { BlogPostOut } from "@/modules/content/schema"
import type { FeaturedPost } from "@/components/blog/blog-hero"
import { truncate } from "@/lib/utils"
import { buildSeoMetadata } from "@/lib/seo"
import { BlogHero } from "@/components/blog/blog-hero"
import { BlogGrid } from "@/components/blog/blog-grid"
import { NewsletterSection } from "@/components/home/newsletter-section"
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb"

export const revalidate = 60

export const metadata = buildSeoMetadata({ title: "Leather Guides, Style Tips and Care Advice", description: "Read Eligo Leather guides covering leather care, craftsmanship, product selection, timeless styling ideas and practical advice for leather goods.", path: "/blog", keywords: ["leather care guide", "leather style blog", "leather craftsmanship"] })

function toFeaturedPost(post: BlogPostOut): FeaturedPost {
  const plainBody = (post.body ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  return {
    slug: post.handle,
    title: post.title,
    date: new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(post.published_at || post.created_at)),
    excerpt: post.excerpt || truncate(plainBody, 240),
    image: post.featured_image_url || post.thumbnail_url || "",
  }
}

export default async function BlogIndexPage() {
  let posts: BlogPostOut[] = []

  try {
    posts = await listBlogPosts({ visibility: "Visible", limit: 50 })
  } catch (error) {
    console.error("Could not fetch blog posts:", error)
  }

  // Latest admin-published post becomes the featured hero article.
  const [featuredRaw, ...restPosts] = posts
  const featured = featuredRaw ? toFeaturedPost(featuredRaw) : null

  return (
    <div className="relative min-h-screen bg-slate-50 font-['Manrope']">
      <div className="relative z-10 px-4 pt-4 sm:px-6 lg:absolute lg:left-[6.25vw] lg:top-[1.5vw] lg:px-0 lg:pt-0">
        <PageBreadcrumb positioned={false} items={[{ label: "Blog" }]} />
      </div>

      {/* Featured article */}
      {featured && <BlogHero post={featured} />}

      {/* Dynamic blog cards */}
      {(restPosts.length > 0 || !featured) && <BlogGrid initialPosts={restPosts} />}

      {/* Newsletter Subscription Banner */}
      <NewsletterSection />
    </div>
  )
}
