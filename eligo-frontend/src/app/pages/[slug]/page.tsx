import type { Metadata } from "next"
import Link from "next/link"
import { api } from "@/lib/api-client"
import { sanitizeCmsHtml } from "@/lib/sanitize-html"
import { absoluteUrl, buildSeoMetadata } from "@/lib/seo"

interface CmsPageRecord {
  title: string
  handle: string
  content: string
  visibility: "Visible" | "Hidden" | string
  updated_at?: string
  seo_title?: string | null
  seo_description?: string | null
}

type PageProps = {
  params: Promise<{ slug: string }>
}

async function fetchPage(slug: string): Promise<CmsPageRecord> {
  try {
    return await api.get<CmsPageRecord>(`/pages/${slug}`, {
      auth: false,
      cache: "no-store",
    })
  } catch {
    console.log("Pages API offline, using fallback content.")
  }

  const titleFormatted = slug
    .replace(/avada-sitemap-/g, "HTML Sitemap for ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())

  return {
    title: titleFormatted,
    handle: slug,
    content: `<p>Welcome to <strong>Eligo Leather Official ${titleFormatted}</strong> page.</p><p>For inquiries or assistance regarding your orders, contact us at <a href="mailto:eligoleather9@gmail.com">eligoleather9@gmail.com</a> or phone +92 334 5399470.</p>`,
    visibility: "Visible",
    updated_at: new Date().toISOString(),
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const page = await fetchPage(slug)
  const description = page.seo_description ||
    `Read ${page.title} information from Eligo Leather, Pakistan's online store for handcrafted genuine leather products and accessories.`

  return buildSeoMetadata({
    title: page.seo_title || page.title,
    description,
    path: `/pages/${page.handle || slug}`,
    noIndex: page.visibility === "Hidden",
    keywords: [page.title],
  })
}

export default async function CustomerStorefrontPage({ params }: PageProps) {
  const { slug } = await params
  const page = await fetchPage(slug)
  const pageUrl = absoluteUrl(`/pages/${page.handle || slug}`)
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
          dangerouslySetInnerHTML={{ __html: sanitizeCmsHtml(page.content) }}
        />
        <div className="border-t border-gray-100 pt-8 text-sm text-gray-500">
          Last updated: {page.updated_at ? new Date(page.updated_at).toLocaleDateString() : "Recently"}
        </div>
      </div>
    </div>
  )
}