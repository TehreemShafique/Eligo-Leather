import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { cache } from "react"
import { sanitizeCmsHtml } from "@/lib/sanitize-html"
import { absoluteUrl, buildSeoMetadata, cleanSeoDescription } from "@/lib/seo"
import { resolvePageState } from "@/modules/content/api"
import { StorefrontUnavailable } from "@/components/storefront-unavailable"

type PageProps = {
  params: Promise<{ slug: string }>
}

// Per-request memoization of the shared CMS page state resolver so
// generateMetadata and the page body agree on the outcome and share the same
// no-store fetch within one request, while each new request still fetches fresh.
const resolvePageStateCached = cache(resolvePageState)

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const state = await resolvePageStateCached(slug)

  if (state.kind === "hidden" || state.kind === "missing") {
    return buildSeoMetadata({
      title: "Page Not Found",
      description: "The requested Eligo Leather page could not be found. Browse our handcrafted leather products and accessories.",
      path: `/pages/${slug}`,
      noIndex: true,
    })
  }

  if (state.kind === "unavailable") {
    return buildSeoMetadata({
      title: "Page Temporarily Unavailable",
      description: "This Eligo Leather page is temporarily unavailable. Please try again shortly.",
      path: `/pages/${slug}`,
      noIndex: true,
    })
  }

  const { page } = state
  const description = cleanSeoDescription(page.seo_description) ||
    `Read ${page.title} information from Eligo Leather, Pakistan's online store for handcrafted genuine leather products and accessories.`

  return buildSeoMetadata({
    title: page.seo_title || page.title,
    description,
    path: `/pages/${page.handle || slug}`,
    keywords: [page.title],
  })
}

export default async function CustomerStorefrontPage({ params }: PageProps) {
  const { slug } = await params
  const state = await resolvePageStateCached(slug)

  if (state.kind === "missing" || state.kind === "hidden") {
    notFound()
  }

  if (state.kind === "unavailable") {
    return <StorefrontUnavailable />
  }

  const { page } = state
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
          dangerouslySetInnerHTML={{ __html: sanitizeCmsHtml(page.content ?? "") }}
        />
        <div className="border-t border-gray-100 pt-8 text-sm text-gray-500">
          Last updated: {page.updated_at ? new Date(page.updated_at).toLocaleDateString() : "Recently"}
        </div>
      </div>
    </div>
  )
}
