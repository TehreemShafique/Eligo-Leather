import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getBlogPostByHandle } from "@/modules/content/api"
import { sanitizeCmsHtml } from "@/lib/sanitize-html"
import { truncate } from "@/lib/utils"
import { absoluteUrl, buildSeoMetadata } from "@/lib/seo"
import { BlogDetailContent, type BlogFaq } from "@/components/blog/blog-detail-content"
import { fetchStoreSchemas } from "@/modules/store/api"

type BlogPageProps = {
  params: Promise<{ slug: string }>
}

// Blog posts store their FAQ builder output as a JSON-encoded string.
function parseBlogFaqs(raw: string | null | undefined): BlogFaq[] | undefined {
  if (!raw) return undefined
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return undefined
    const items = parsed
      .map((entry) => ({
        question: String((entry as Record<string, unknown>)?.question ?? "").trim(),
        answer: String((entry as Record<string, unknown>)?.answer ?? "").trim(),
      }))
      .filter((faq) => faq.question && faq.answer)
    return items.length > 0 ? items : undefined
  } catch {
    return undefined
  }
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
    canonical: post.seo_canonical_url || undefined,
    image: post.featured_image_url || post.thumbnail_url || undefined,
    keywords: post.seo_keyword ? post.seo_keyword.split(",").map((k) => k.trim()).filter(Boolean) : [post.title, "leather care", "leather craftsmanship"],
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

  // A schema published from the admin blog editor for THIS post replaces
  // the built-in BlogPosting JSON-LD to avoid duplicate markup.
  let publishedSchemaJson: string | null = null
  try {
    const schemas = await fetchStoreSchemas()
    const target = `/blog/${post.handle}`
    const match = schemas.find(
      (s) => s.is_active && s.schema_type === "blog" && s.target_pages === target,
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd).replace(/</g, "\\u003c") }}
        />
      )}
      <BlogDetailContent
        post={{ ...post, body: sanitizeCmsHtml(post.body ?? "") }}
        faqs={parseBlogFaqs(post.faqs)}
      />
    </>
  )
}
