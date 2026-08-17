"use client"

import React, { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"

export default function CustomerStorefrontPage() {
  const params = useParams()
  const slug = (params?.slug as string) || "terms-of-service"
  const [page, setPage] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const fetchPageFromDB = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/v1/pages/${slug}`)
        if (res.ok) {
          const data = await res.json()
          if (isMounted) {
            setPage(data)
            setLoading(false)
            return
          }
        }
      } catch (err) {
        console.log("Pages API offline, using fallback content.")
      }

      // Default Fallbacks
      if (isMounted) {
        const titleFormatted = slug
          .replace(/avada-sitemap-/g, "HTML Sitemap for ")
          .replace(/-/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase())

        setPage({
          title: titleFormatted,
          handle: slug,
          content: `<p>Welcome to <strong>Eligo Leather Official ${titleFormatted}</strong> page.</p><p>For inquiries or assistance regarding your orders, contact us at <a href="mailto:eligoleather9@gmail.com">eligoleather9@gmail.com</a> or phone +92 334 5399470.</p>`,
          visibility: "Visible",
          updated_at: new Date().toISOString(),
        })
        setLoading(false)
      }
    }

    fetchPageFromDB()
    return () => {
      isMounted = false
    }
  }, [slug])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-sm text-gray-500">
        Loading page content...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] text-gray-900 font-sans py-12 px-4 sm:px-6">
      {/* Page Level Meta Robots Tag for Search Crawlers */}
      <head>
        <meta
          name="robots"
          content={page?.visibility === "Hidden" ? "noindex, follow" : "index, follow"}
        />
        <title>{page?.seo_title || page?.title || "Eligo Leather"}</title>
        {page?.seo_description && <meta name="description" content={page.seo_description} />}
      </head>

      <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-3xl border border-gray-200 shadow-sm space-y-6">
        {/* Breadcrumb Header */}
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-900 uppercase tracking-widest">
          <Link href="/" className="hover:underline">
            Eligo Leather
          </Link>
          <span>›</span>
          <span className="text-gray-500">Pages</span>
          <span>›</span>
          <span className="text-gray-900 font-bold">{page?.title}</span>
        </div>

        {/* Page Title */}
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 border-b border-gray-100 pb-4">
          {page?.title}
        </h1>

        {/* Content Rendered */}
        <div
          className="prose prose-stone max-w-none text-sm text-gray-800 leading-relaxed [&_h2]:text-xl [&_h2]:font-bold [&_h2]:my-3 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:my-2 [&_p]:my-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-amber-800 [&_a]:font-bold [&_a]:underline"
          dangerouslySetInnerHTML={{ __html: page?.content || "<p>No content available for this page.</p>" }}
        />

        {/* Footer info */}
        <div className="pt-8 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400 font-medium">
          <span>Eligo Leather Handcrafted Collection</span>
          <span>Last Updated: {page?.updated_at ? new Date(page.updated_at).toLocaleDateString("en-GB") : "Recent"}</span>
        </div>
      </div>
    </div>
  )
}
