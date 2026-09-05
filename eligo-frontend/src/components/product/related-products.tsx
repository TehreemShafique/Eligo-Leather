"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { getProductSlug } from "@/modules/catalog/types"
import type { ProductListOut } from "@/modules/catalog/schema"
import { fetchAllReviewSummaries } from "@/modules/reviews/api"
import { StarRating } from "@/components/ui/star-rating"

interface RelatedProductsProps {
  products?: ProductListOut[]
  currentProductId?: number
}

type SummaryMap = Record<string, { average_rating?: number; review_count?: number }>

export function RelatedProducts({ products = [], currentProductId }: RelatedProductsProps) {
  const displayItems = products.filter((p) => p.id !== currentProductId).slice(0, 5)
  const ids = displayItems.map((p) => String(p.id))

  const [summaries, setSummaries] = useState<SummaryMap>({})
  useEffect(() => {
    let mounted = true
    if (ids.length === 0) return
    fetchAllReviewSummaries().then((map) => {
      if (mounted) setSummaries(map)
    })
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(",")])

  if (displayItems.length === 0) {
    return null
  }

  return (
    <section className="py-12 bg-transparent font-['Manrope'] w-full max-w-[1780px] min-h-[576px] mx-auto">
      <div className="max-w-[1780px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-black tracking-tight">
            Related Products
          </h2>
        </div>

        {/* 5-Column Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {displayItems.map((item) => {
            const slug = getProductSlug(item)
            const price = item.price ? parseFloat(item.price) : 0
            const compareAt = item.compare_at_price ? parseFloat(item.compare_at_price) : null
            const imageUrl = item.image_url || ""
            const summary = summaries[String(item.id)]
            const count = summary?.review_count ?? 0
            const rating = count > 0 ? summary?.average_rating ?? 0 : 0

            return (
              <div
                key={item.id}
                className="group bg-white rounded-[20px] border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Image Container */}
                  <Link
                    href={`/${slug}`}
                    className="group/img relative block h-64 w-full bg-zinc-100 rounded-[20px] overflow-hidden mb-4 cursor-pointer"
                  >
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={item.title}
                        fill
                        className="object-cover group-hover/img:scale-105 transition-all duration-500 ease-in-out"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                        No image
                      </div>
                    )}
                    {item.status === "Active" && compareAt && compareAt > price && (
                      <div className="absolute top-3 right-3 bg-amber-800 text-white text-xs font-semibold px-2.5 py-1 rounded-[5px] shadow-sm z-10">
                        Sale
                      </div>
                    )}
                  </Link>

                  {/* Rating */}
                  <div className="flex items-center justify-between text-xs mb-2">
                    <StarRating rating={rating} reviewCount={count} />
                  </div>

                  {/* Pricing */}
                  <div className="flex items-center gap-2 mb-2 font-['Manrope']">
                    {compareAt && compareAt > 0 && (
                      <span className="text-xs text-gray-400 line-through">
                        Rs.{compareAt.toLocaleString()}
                      </span>
                    )}
                    {price > 0 && (
                      <span className="text-sm font-bold text-zinc-950">
                        Rs.{price.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* Product Title */}
                  <h3 className="text-sm font-bold text-black font-['Manrope'] leading-snug line-clamp-2 mb-4 group-hover:text-amber-800 transition-colors">
                    {item.title}
                  </h3>
                </div>

                {/* View Button */}
                <Link
                  href={`/${slug}`}
                  className="w-full py-2.5 px-4 rounded-[5px] border border-amber-800 text-amber-800 text-sm font-semibold text-center hover:bg-amber-800 hover:text-white transition-colors font-['Manrope'] inline-block"
                >
                  View
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
