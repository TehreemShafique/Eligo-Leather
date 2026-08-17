import type { Metadata } from "next"
import { BlogDetailContent } from "@/components/blog/blog-detail-content"

type BlogPageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { slug } = await params
  const titleFormatted = slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")

  return {
    title: `${titleFormatted} | Eligo Leather Blog`,
    description: `Read our latest blog post on ${titleFormatted} from Eligo Leather.`,
  }
}

export default async function BlogDetailPage({ params }: BlogPageProps) {
  const { slug } = await params

  const titleFormatted = slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")

  const articleData = {
    title:
      slug === "luxury-leather-glasses-case"
        ? "Luxury Leather Glasses Case: A Touch of Elegance for Everyday Use"
        : titleFormatted,
    date: "Feb 4, 2026",
    image:
      "https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&q=80&w=1200",
  }

  const blogJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `https://eligoleather.com/blog/${slug}/#blogposting`,
        "headline": articleData.title,
        "description": `Read our latest editorial guide on ${articleData.title} by Eligo Leather artisans.`,
        "image": [articleData.image],
        "datePublished": "2026-02-04T08:00:00+05:00",
        "dateModified": "2026-02-04T08:00:00+05:00",
        "author": {
          "@type": "Person",
          "name": "Bilal Hussain Abbasi",
          "url": "https://eligoleather.com/authors/bilal-abbasi"
        },
        "publisher": {
          "@type": "Organization",
          "name": "Eligo Leather Official Store",
          "url": "https://eligoleather.com",
          "logo": {
            "@type": "ImageObject",
            "url": "https://eligoleather.com/logo.png"
          }
        },
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": `https://eligoleather.com/blog/${slug}`
        }
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://eligoleather.com" },
          { "@type": "ListItem", "position": 2, "name": "Blogs", "item": "https://eligoleather.com/blogs" },
          { "@type": "ListItem", "position": 3, "name": articleData.title, "item": `https://eligoleather.com/blog/${slug}` }
        ]
      },
      {
        "@type": "Organization",
        "name": "Eligo Leather Official Store",
        "url": "https://eligoleather.com",
        "logo": "https://eligoleather.com/logo.png",
        "sameAs": [
          "https://facebook.com/eligoleather",
          "https://instagram.com/eligoleather"
        ]
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": `What are the key highlights of ${articleData.title}?`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "This guide covers essential leather care, craftsmanship techniques, and choosing top-grain leather goods."
            }
          },
          {
            "@type": "Question",
            "name": "Are Eligo Leather blog recommendations tested on genuine leather?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes! All tips and recommendations are tested by our master leather artisans."
            }
          }
        ]
      }
    ]
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />
      <BlogDetailContent article={articleData} slug={slug} />
    </>
  )
}
