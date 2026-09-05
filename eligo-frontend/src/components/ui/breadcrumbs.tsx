"use client"

import Link from "next/link"
import { CaretRight, House } from "@phosphor-icons/react"
import { absoluteUrl } from "@/lib/seo"

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  showHomeIcon?: boolean
}

export function Breadcrumbs({ items, showHomeIcon = true }: BreadcrumbsProps) {
  // Build full list including Home
  const fullItems: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    ...items,
  ]

  // Construct JSON-LD Schema for Google Search SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: fullItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: item.href ? absoluteUrl(item.href) : undefined,
    })),
  }

  return (
    <>
      {/* Schema.org Structured Data Script for Search Engine SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      {/* Visual Breadcrumb Navigation Bar */}
      <nav aria-label="Breadcrumb" className="py-4 font-['Manrope']">
        <ol className="flex items-center flex-wrap gap-2 text-sm sm:text-base font-medium">
          {fullItems.map((item, idx) => {
            const isLast = idx === fullItems.length - 1
            const isHome = idx === 0

            return (
              <li key={idx} className="flex items-center gap-2">
                {idx > 0 && (
                  <CaretRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                )}

                {isLast || !item.href ? (
                  <span
                    aria-current={isLast ? "page" : undefined}
                    className="text-amber-800 font-semibold"
                  >
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className="text-black hover:text-amber-800 transition-colors inline-flex items-center gap-1"
                  >
                    {isHome && showHomeIcon && (
                      <House className="w-4 h-4 text-gray-600 hover:text-amber-800 transition-colors" />
                    )}
                    <span>{item.label}</span>
                  </Link>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
    </>
  )
}
