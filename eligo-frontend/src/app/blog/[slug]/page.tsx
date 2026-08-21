import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getBlogPostByHandle } from "@/modules/content/api"
import { sanitizeCmsHtml } from "@/lib/sanitize-html"
import { truncate } from "@/lib/utils"
import { absoluteUrl, buildSeoMetadata } from "@/lib/seo"
import { BlogDetailContent } from "@/components/blog/blog-detail-content"

type BlogPageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getBlogPostByHandle(slug)
  if (!post || post.visibility === "Hidden") {
    return buildSeoMetadata({
      title: "Blog Post Not Found",
      description: "The requested Eligo Leather article is unavailable. Explore our latest leather care, craftsmanship and style guides.",
      path: `/blog/${slug}`,
      noIndex: true,
      type: "article",
    })
  }

  return buildSeoMetadata({
    title: post.seo_title ?? post.title,
    description: post.seo_description ?? (post.excerpt ? truncate(post.excerpt, 155) : `Read ${post.title} from Eligo Leather.`),
    path: `/blog/${post.handle}`,
    image: post.featured_image_url || post.thumbnail_url || undefined,
    keywords: [post.title, "leather care", "leather craftsmanship"],
    type: "article",
  })
}

export default async function BlogDetailPage({ params }: BlogPageProps) {
  const { slug } = await params
  const post = await getBlogPostByHandle(slug)
  if (!post || post.visibility === "Hidden") {
    notFound()
  }

  const publishedDate = post.published_at || post.created_at

  const blogJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${absoluteUrl(`/blog/${post.handle}`)}/#blogposting`,
        "headline": post.title,
        "description": post.excerpt || post.title,
        "image": [post.featured_image_url || post.thumbnail_url || absoluteUrl("/images/blog_hero.webp")],
        "datePublished": publishedDate,
        "dateModified": post.updated_at || publishedDate,
        "author": {
          "@type": "Person",
          "name": post.author,
        },
        "publisher": {
          "@type": "Organization",
          "name": "Eligo Leather Official Store",
          "url": absoluteUrl("/"),
          "logo": {
            "@type": "ImageObject",
            "url": absoluteUrl("/images/homepage/2_rectangle_1655.webp")
          }
        },
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": absoluteUrl(`/blog/${post.handle}`)
        }
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": absoluteUrl("/") },
          { "@type": "ListItem", "position": 2, "name": "Blogs", "item": absoluteUrl("/blog") },
          { "@type": "ListItem", "position": 3, "name": post.title, "item": absoluteUrl(`/blog/${post.handle}`) }
        ]
      },
      {
        "@type": "Organization",
        "name": "Eligo Leather Official Store",
        "url": absoluteUrl("/"),
        "logo": absoluteUrl("/images/homepage/2_rectangle_1655.webp"),
        "sameAs": [
          "https://facebook.com/eligoleather",
          "https://instagram.com/eligoleather"
        ]
      }
    ]
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd).replace(/</g, "\\u003c") }}
      />
      <BlogDetailContent post={{ ...post, body: sanitizeCmsHtml(post.body ?? "") }} />
    </>
  )
}
