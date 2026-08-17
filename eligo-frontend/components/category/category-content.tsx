"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { CategorySidebar } from "./category-sidebar"
import { CategorySortBar } from "./category-sort-bar"
import { CategorySeoSection } from "./category-seo-section"

export interface CategoryProduct {
  id: string | number
  title: string
  originalPrice: number
  salePrice: number
  rating: number
  reviewCount: number
  image: string
  secondaryImage?: string
  isSale?: boolean
  subcategoryId?: string
}

// Full dataset of 24 products matching Figma mock items and subcategories
const CATEGORY_PRODUCTS_CATALOG: CategoryProduct[] = [
  // Bifold Wallets
  {
    id: 1,
    title: "ARDOR - Handmade Leather Card Holder Bifold Wallet",
    originalPrice: 5199,
    salePrice: 1699,
    rating: 5.0,
    reviewCount: 35,
    image: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=600",
    secondaryImage: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=600",
    isSale: true,
    subcategoryId: "bifold",
  },
  {
    id: 2,
    title: "HERALD - Classic Leather Bifold Coin Pocket Wallet",
    originalPrice: 4999,
    salePrice: 1699,
    rating: 5.0,
    reviewCount: 42,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=600",
    secondaryImage: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=600",
    isSale: true,
    subcategoryId: "bifold",
  },
  {
    id: 3,
    title: "VANGUARD - Full Grain Leather Money Clip Bifold Wallet",
    originalPrice: 5199,
    salePrice: 1699,
    rating: 5.0,
    reviewCount: 35,
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=600",
    secondaryImage: "https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&q=80&w=600",
    isSale: true,
    subcategoryId: "bifold",
  },
  {
    id: 4,
    title: "SOLO - Slim Handmade Minimalist Leather Bifold Sleeve",
    originalPrice: 5199,
    salePrice: 1699,
    rating: 5.0,
    reviewCount: 35,
    image: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=600",
    secondaryImage: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=600",
    isSale: true,
    subcategoryId: "bifold",
  },

  // Trifold Wallets
  {
    id: 5,
    title: "TITAN - Handmade RFID Leather Trifold Wallet",
    originalPrice: 5199,
    salePrice: 1699,
    rating: 5.0,
    reviewCount: 35,
    image: "https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&q=80&w=600",
    secondaryImage: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=600",
    isSale: true,
    subcategoryId: "trifold",
  },
  {
    id: 6,
    title: "LEGEND - Multi-Card Compartment Trifold Wallet",
    originalPrice: 4999,
    salePrice: 1699,
    rating: 4.9,
    reviewCount: 29,
    image: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=600",
    secondaryImage: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=600",
    isSale: false,
    subcategoryId: "trifold",
  },
  {
    id: 7,
    title: "ROYAL - Handmade Executive Leather Trifold Wallet",
    originalPrice: 5199,
    salePrice: 1699,
    rating: 5.0,
    reviewCount: 35,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=600",
    secondaryImage: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=600",
    isSale: true,
    subcategoryId: "trifold",
  },
  {
    id: 8,
    title: "APEX - Heavy Duty Grain Leather Trifold Wallet",
    originalPrice: 4800,
    salePrice: 1699,
    rating: 4.8,
    reviewCount: 31,
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=600",
    secondaryImage: "https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&q=80&w=600",
    isSale: true,
    subcategoryId: "trifold",
  },

  // Long Wallets
  {
    id: 9,
    title: "SOVEREIGN - Real Leather Long Checkbook Wallet",
    originalPrice: 5999,
    salePrice: 2499,
    rating: 5.0,
    reviewCount: 50,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=600",
    secondaryImage: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=600",
    isSale: true,
    subcategoryId: "long",
  },
  {
    id: 10,
    title: "EMPEROR - Zipper Around Genuine Leather Long Wallet",
    originalPrice: 6500,
    salePrice: 2799,
    rating: 4.9,
    reviewCount: 44,
    image: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=600",
    secondaryImage: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=600",
    isSale: true,
    subcategoryId: "long",
  },
  {
    id: 11,
    title: "MONARCH - Slim Long Travel Passport Leather Wallet",
    originalPrice: 5400,
    salePrice: 1999,
    rating: 5.0,
    reviewCount: 38,
    image: "https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&q=80&w=600",
    secondaryImage: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=600",
    isSale: false,
    subcategoryId: "long",
  },
  {
    id: 12,
    title: "VALOR - Handmade Genuine Cowhide Long Coat Wallet",
    originalPrice: 5199,
    salePrice: 1699,
    rating: 5.0,
    reviewCount: 35,
    image: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=600",
    secondaryImage: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=600",
    isSale: true,
    subcategoryId: "long",
  },

  // Crocodile Wallets
  {
    id: 13,
    title: "CROWN - Luxury Crocodile Texture Genuine Leather Wallet",
    originalPrice: 5999,
    salePrice: 2199,
    rating: 5.0,
    reviewCount: 48,
    image: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=600",
    secondaryImage: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=600",
    isSale: true,
    subcategoryId: "crocodile",
  },
  {
    id: 14,
    title: "BARON - Embossed Crocodile Skin Slim Bifold Wallet",
    originalPrice: 5200,
    salePrice: 1899,
    rating: 4.8,
    reviewCount: 22,
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=600",
    secondaryImage: "https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&q=80&w=600",
    isSale: true,
    subcategoryId: "crocodile",
  },
  {
    id: 15,
    title: "MAJESTY - Premium Crocodile Pattern Card Holder Wallet",
    originalPrice: 5199,
    salePrice: 1699,
    rating: 5.0,
    reviewCount: 35,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=600",
    secondaryImage: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=600",
    isSale: true,
    subcategoryId: "crocodile",
  },
  {
    id: 16,
    title: "VENOM - Alligator & Crocodile Grain Leather Wallet",
    originalPrice: 5500,
    salePrice: 1999,
    rating: 4.9,
    reviewCount: 40,
    image: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=600",
    secondaryImage: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=600",
    isSale: true,
    subcategoryId: "crocodile",
  },

  // Note Clip Wallets
  {
    id: 17,
    title: "CLIPPER - Minimalist Leather Note Clip Wallet",
    originalPrice: 4200,
    salePrice: 1499,
    rating: 4.9,
    reviewCount: 26,
    image: "https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&q=80&w=600",
    secondaryImage: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=600",
    isSale: true,
    subcategoryId: "note-clip",
  },
  {
    id: 18,
    title: "PULSE - Stainless Money Clip Leather Bifold Wallet",
    originalPrice: 4500,
    salePrice: 1599,
    rating: 5.0,
    reviewCount: 33,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=600",
    secondaryImage: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=600",
    isSale: true,
    subcategoryId: "note-clip",
  },
  {
    id: 19,
    title: "STRIDE - Ultra Slim Note Clip Leather Card Sleeve",
    originalPrice: 3800,
    salePrice: 1399,
    rating: 4.7,
    reviewCount: 18,
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=600",
    secondaryImage: "https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&q=80&w=600",
    isSale: false,
    subcategoryId: "note-clip",
  },
  {
    id: 20,
    title: "METRO - Genuine Leather Cash Clip Front Pocket Wallet",
    originalPrice: 5199,
    salePrice: 1699,
    rating: 5.0,
    reviewCount: 35,
    image: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=600",
    secondaryImage: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=600",
    isSale: true,
    subcategoryId: "note-clip",
  },

  // Vintage Wallets
  {
    id: 21,
    title: "HERITAGE - Vintage Crazy Horse Leather Bifold Wallet",
    originalPrice: 5400,
    salePrice: 1799,
    rating: 5.0,
    reviewCount: 41,
    image: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=600",
    secondaryImage: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=600",
    isSale: true,
    subcategoryId: "vintage",
  },
  {
    id: 22,
    title: "RUSTIC - Distressed Antique Leather Trifold Wallet",
    originalPrice: 4900,
    salePrice: 1699,
    rating: 4.9,
    reviewCount: 37,
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=600",
    secondaryImage: "https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&q=80&w=600",
    isSale: true,
    subcategoryId: "vintage",
  },
  {
    id: 23,
    title: "PIONEER - Vintage Burnished Tan Leather Card Holder",
    originalPrice: 5199,
    salePrice: 1699,
    rating: 5.0,
    reviewCount: 35,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=600",
    secondaryImage: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=600",
    isSale: true,
    subcategoryId: "vintage",
  },
  {
    id: 24,
    title: "CLASSIC - Retro Distressed Leather Coin Pocket Wallet",
    originalPrice: 4800,
    salePrice: 1599,
    rating: 4.8,
    reviewCount: 25,
    image: "https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&q=80&w=600",
    secondaryImage: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=600",
    isSale: true,
    subcategoryId: "vintage",
  },
]

export interface CategoryContentProps {
  initialProducts?: CategoryProduct[]
  categoryTitle?: string
  currentSlug?: string
}

export function CategoryContent({
  initialProducts = [],
  categoryTitle = "All Wallets Category",
  currentSlug,
}: CategoryContentProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState<string>("default")
  const [activeSubcategory, setActiveSubcategory] = useState<string>(currentSlug || "all")
  const [visibleCount, setVisibleCount] = useState<number>(12)

  const baseProductsList = initialProducts.length > 0 ? initialProducts : CATEGORY_PRODUCTS_CATALOG

  // Filter & Sort Logic
  const processedProducts = useMemo(() => {
    let result = [...baseProductsList]

    // Subcategory Filtering Logic
    if (activeSubcategory && activeSubcategory !== "all" && activeSubcategory !== "wallets") {
      const subFilter = activeSubcategory.toLowerCase()
      const filtered = result.filter((p) => {
        const subId = (p.subcategoryId || "").toLowerCase()
        const titleLower = (p.title || "").toLowerCase()
        return subId.includes(subFilter) || titleLower.includes(subFilter)
      })

      // If filter returns matching items, use them; otherwise filter catalog
      if (filtered.length > 0) {
        result = filtered
      } else {
        const catalogFiltered = CATEGORY_PRODUCTS_CATALOG.filter((p) =>
          (p.subcategoryId || "").toLowerCase().includes(subFilter) ||
          (p.title || "").toLowerCase().includes(subFilter)
        )
        if (catalogFiltered.length > 0) {
          result = catalogFiltered
        }
      }
    }

    if (sortBy === "price-asc") {
      result.sort((a, b) => a.salePrice - b.salePrice)
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => b.salePrice - a.salePrice)
    } else if (sortBy === "rating") {
      result.sort((a, b) => b.rating - a.rating)
    }

    return result
  }, [baseProductsList, activeSubcategory, sortBy])

  // Products to render based on pagination (12 items per page)
  const visibleProducts = processedProducts.slice(0, visibleCount)

  const handleShowMore = () => {
    setVisibleCount((prev) => prev + 12)
  }

  return (
    <div suppressHydrationWarning className="py-8 bg-slate-50 min-h-screen font-['Manrope']">
      <div suppressHydrationWarning className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* SEO Breadcrumbs Navigation */}
        <div suppressHydrationWarning className="mb-6">
          <Breadcrumbs
            items={[
              { label: "Products", href: "/products" },
              { label: categoryTitle },
            ]}
          />
        </div>

        {/* Main Flex Layout: Left Sidebar + Right Catalog Grid */}
        <div suppressHydrationWarning className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Left Category Sidebar */}
          <CategorySidebar
            categoryTitle={categoryTitle}
            activeSubcategory={activeSubcategory}
            onSelectSubcategory={(id) => {
              setActiveSubcategory(id)
              setVisibleCount(12) // Reset visible items to 12 on category filter change
            }}
          />

          {/* Right Main Catalog Container (1340px Figma Frame) */}
          <main suppressHydrationWarning className="flex-1 w-full max-w-[1340px]">
            {/* Top Sort & Controls Bar */}
            <CategorySortBar
              totalResults={processedProducts.length}
              currentResultsCount={visibleProducts.length}
              viewMode={viewMode}
              onViewModeChange={(mode) => setViewMode(mode)}
              sortBy={sortBy}
              onSortChange={(sort) => setSortBy(sort)}
            />

            {/* Product Grid View Mode: 4 Products Per Line (320x320 Square Cards) */}
            {viewMode === "grid" ? (
              <div suppressHydrationWarning className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {visibleProducts.map((item) => {
                  const secondaryImg =
                    item.secondaryImage ||
                    "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=600"

                  return (
                    <div
                      key={item.id}
                      className="group bg-white rounded-[20px] border border-gray-100 p-4 shadow-xs hover:shadow-xl transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* 320x320 Square Product Image Container with Pic 1 -> Pic 2 Hover Transition */}
                        <Link
                          href={`/products/${item.id}`}
                          className="group/img relative block aspect-square w-full bg-zinc-100 rounded-[20px] overflow-hidden mb-4 cursor-pointer"
                        >
                          {/* Main Image Pic 1 */}
                          <Image
                            src={item.image}
                            alt={item.title}
                            fill
                            className="object-cover opacity-100 group-hover/img:opacity-0 group-hover:opacity-0 group-hover/img:scale-105 group-hover:scale-105 transition-all duration-500 ease-in-out"
                          />
                          {/* Secondary Image Pic 2 (Shows on Hover) */}
                          <Image
                            src={secondaryImg}
                            alt={`${item.title} alternate view`}
                            fill
                            className="object-cover opacity-0 group-hover/img:opacity-100 group-hover:opacity-100 group-hover/img:scale-105 group-hover:scale-105 transition-all duration-500 ease-in-out"
                          />

                          {item.isSale && (
                            <div className="absolute top-3 right-3 bg-amber-800 text-white text-xs font-semibold px-2.5 py-1 rounded-[5px] shadow-sm z-10">
                              Sale
                            </div>
                          )}
                        </Link>

                        {/* Price & Rating Line Matching Figma Layout */}
                        <div className="flex items-center justify-between text-xs mb-2">
                          <div className="flex items-center gap-1.5 font-['Manrope']">
                            <span className="text-zinc-950 font-semibold text-xs">
                              Rs.{item.salePrice.toLocaleString()}
                            </span>
                            <span className="text-neutral-400 text-xs line-through">
                              Rs.{item.originalPrice.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 font-['Manrope'] text-[11px]">
                            <span className="text-neutral-400">Review </span>
                            <span className="text-zinc-950 font-normal">
                              {item.reviewCount}/{item.rating.toFixed(1)}
                            </span>
                            <span className="text-amber-500 font-serif tracking-widest text-xs ml-0.5">
                              ★★★★★
                            </span>
                          </div>
                        </div>

                        {/* Product Title */}
                        <h3 className="text-sm font-bold text-black font-['Manrope'] leading-snug line-clamp-2 mb-4 group-hover:text-amber-800 transition-colors">
                          {item.title}
                        </h3>
                      </div>

                      {/* View Button */}
                      <Link
                        href={`/products/${item.id}`}
                        className="w-full py-2.5 px-4 rounded-[5px] border border-amber-800 text-amber-800 text-sm font-semibold text-center hover:bg-amber-800 hover:text-white transition-colors font-['Manrope'] inline-block"
                      >
                        View
                      </Link>
                    </div>
                  )
                })}
              </div>
            ) : (
              /* List View Mode with Pic 1 -> Pic 2 Hover Transition */
              <div className="space-y-4">
                {visibleProducts.map((item) => {
                  const secondaryImg =
                    item.secondaryImage ||
                    "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=600"

                  return (
                    <div
                      key={item.id}
                      className="group bg-white rounded-[20px] border border-gray-100 p-4 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row items-center gap-6"
                    >
                      <Link
                        href={`/products/${item.id}`}
                        className="group/img relative block h-48 w-full sm:w-48 shrink-0 bg-zinc-100 rounded-[15px] overflow-hidden cursor-pointer"
                      >
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover opacity-100 group-hover/img:opacity-0 group-hover:opacity-0 group-hover/img:scale-105 group-hover:scale-105 transition-all duration-500 ease-in-out"
                        />
                        <Image
                          src={secondaryImg}
                          alt={`${item.title} alternate view`}
                          fill
                          className="object-cover opacity-0 group-hover/img:opacity-100 group-hover:opacity-100 group-hover/img:scale-105 group-hover:scale-105 transition-all duration-500 ease-in-out"
                        />
                        {item.isSale && (
                          <div className="absolute top-2 right-2 bg-amber-800 text-white text-xs font-semibold px-2 py-0.5 rounded-[4px] z-10">
                            Sale
                          </div>
                        )}
                      </Link>

                      <div className="flex-1 space-y-3 w-full">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 font-['Manrope'] text-xs">
                            <span className="text-neutral-400">Review </span>
                            <span className="text-zinc-950 font-normal">
                              {item.reviewCount}/{item.rating.toFixed(1)}
                            </span>
                            <span className="text-amber-500 font-serif tracking-widest text-xs ml-1">
                              ★★★★★
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 line-through">
                              Rs.{item.originalPrice.toLocaleString()}
                            </span>
                            <span className="text-base font-bold text-zinc-950">
                              Rs.{item.salePrice.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <h3 className="text-lg font-bold text-black font-['Manrope'] hover:text-amber-800 transition-colors">
                          {item.title}
                        </h3>

                        <div className="pt-2">
                          <Link
                            href={`/products/${item.id}`}
                            className="px-6 py-2.5 rounded-[5px] border border-amber-800 text-amber-800 text-sm font-semibold hover:bg-amber-800 hover:text-white transition-colors inline-block"
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Pagination: Show More Products Button (Displays next 12 products on click) */}
            {processedProducts.length > visibleCount && (
              <div className="mt-12 text-center">
                <button
                  type="button"
                  onClick={handleShowMore}
                  className="px-10 py-3.5 bg-white border border-amber-800 text-amber-800 hover:bg-amber-800 hover:text-white text-sm font-semibold rounded-[5px] transition-all duration-300 shadow-sm inline-flex items-center gap-2 cursor-pointer"
                >
                  Show More Products ({processedProducts.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </main>
        </div>

        {/* Bottom SEO Content Section */}
        <CategorySeoSection />
      </div>
    </div>
  )
}
