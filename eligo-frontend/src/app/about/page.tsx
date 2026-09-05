import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getPageByHandle } from "@/modules/content/api"
import { sanitizeCmsHtml } from "@/lib/sanitize-html"
import { absoluteUrl, buildSeoMetadata, cleanSeoDescription } from "@/lib/seo"

export const revalidate = 60

const ABOUT_US_HANDLE = "about-us"

async function fetchAboutPage() {
  return getPageByHandle(ABOUT_US_HANDLE)
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await fetchAboutPage()
  if (!page || page.visibility === "Hidden") {
    return buildSeoMetadata({
      title: "About Us",
      description: "Learn about Eligo Leather craftsmanship and heritage.",
      path: "/about",
      noIndex: true,
    })
  }

  return buildSeoMetadata({
    title: page.seo_title || page.title,
    description: cleanSeoDescription(page.seo_description) ||
      `Read ${page.title} information from Eligo Leather, Pakistan's online store for handcrafted genuine leather products and accessories.`,
    path: "/about",
    keywords: [page.title],
  })
}

export default async function AboutUsPage() {
  // Content is managed by the admin under Online Stores -> Pages
  // ("About Us" page) and served from the database.
  const page = await fetchAboutPage()
  if (!page || page.visibility === "Hidden") {
    notFound()
  }

  const pageUrl = absoluteUrl("/about")
  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${pageUrl}/#webpage`,
    url: pageUrl,
    name: page.title,
    dateModified: page.updated_at,
    isPartOf: { "@id": `${absoluteUrl("/")}/#website` },
    inLanguage: "en-PK",
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] px-4 py-12 font-sans text-gray-900 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd).replace(/</g, "\\u003c") }}
      />
      <div className="mx-auto max-w-3xl space-y-6 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm sm:p-12">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-amber-900">
          <Link href="/">Home</Link><span>/</span><span>{page.title}</span>
        </div>
        <h1 className="border-b border-gray-100 pb-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          {page.title}
        </h1>
        <article
          className="prose prose-neutral max-w-none prose-headings:font-semibold prose-a:text-amber-800"
          dangerouslySetInnerHTML={{ __html: sanitizeCmsHtml(page.content ?? "") }}
        />
        <div className="border-t border-gray-100 pt-8 text-sm text-gray-500">
          Last updated: {page.updated_at ? new Date(page.updated_at).toLocaleDateString() : "Recently"}
        </div>
      </div>
    </div>
  )
}
