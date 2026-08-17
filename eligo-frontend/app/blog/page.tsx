import { BlogHero } from "@/components/blog/blog-hero"
import { BlogGrid } from "@/components/blog/blog-grid"
import { NewsletterSection } from "@/components/home/newsletter-section"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"

export default function BlogIndexPage() {
  return (
    <div className="py-8 bg-slate-50 min-h-screen font-['Manrope']">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* SEO Breadcrumbs */}
        <div className="mb-4">
          <Breadcrumbs items={[{ label: "Blog" }]} />
        </div>

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-5xl sm:text-6xl font-bold text-amber-800 tracking-tight">
            Blog
          </h1>
        </div>

        {/* Featured Hero Article */}
        <BlogHero />

        {/* Latest Insights & Trends Grid */}
        <BlogGrid />

        {/* Newsletter Subscription Banner */}
        <NewsletterSection />
      </div>
    </div>
  )
}
