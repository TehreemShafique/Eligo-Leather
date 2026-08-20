import { listBlogPosts } from "@/modules/content/api"
import type { BlogPostOut } from "@/modules/content/schema"
import { buildSeoMetadata } from "@/lib/seo"
import { BlogHero } from "@/components/blog/blog-hero"
import { BlogGrid } from "@/components/blog/blog-grid"
import { NewsletterSection } from "@/components/home/newsletter-section"
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb"

export const revalidate = 60

export const metadata = buildSeoMetadata({ title: "Leather Guides, Style Tips and Care Advice", description: "Read Eligo Leather guides covering leather care, craftsmanship, product selection, timeless styling ideas and practical advice for leather goods.", path: "/blog", keywords: ["leather care guide", "leather style blog", "leather craftsmanship"] })

export default async function BlogIndexPage() {
  let posts: BlogPostOut[] = []

  try {
    posts = await listBlogPosts({ visibility: "Visible", limit: 50 })
  } catch (error) {
    console.error("Could not fetch blog posts:", error)
  }

  return (
    <div className="relative min-h-screen bg-slate-50 font-['Manrope']">
      <div className="relative z-10 px-4 pt-4 sm:px-6 lg:absolute lg:left-[6.25vw] lg:top-[1.5vw] lg:px-0 lg:pt-0">
        <PageBreadcrumb positioned={false} items={[{ label: "Blog" }]} />
      </div>

      {/* Static featured article */}
      <BlogHero />

      {/* Dynamic blog cards */}
      <BlogGrid initialPosts={posts} />

      {/* Newsletter Subscription Banner */}
      <NewsletterSection />
    </div>
  )
}
