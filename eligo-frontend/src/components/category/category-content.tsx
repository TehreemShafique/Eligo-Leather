"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CaretDown } from "@phosphor-icons/react"

export interface CategoryProduct {
  id: string | number
  slug?: string
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

export interface CategorySidebarItem {
  id: string | number
  name: string
  href: string
  handle?: string
}

export interface CategoryContentProps {
  initialProducts?: CategoryProduct[]
  categoryTitle?: string
  currentSlug?: string
  /** Admin-created categories (shared source with the header dropdown). */
  sidebarCategories?: CategorySidebarItem[]
}

// Fixed vertical slots for the absolutely-positioned desktop sidebar links
// (same rhythm as the original design, extended for larger category lists).
const SIDEBAR_ITEM_POSITIONS = [
  "lg:top-[7.8125cqw]",
  "lg:top-[9.895833cqw]",
  "lg:top-[11.979167cqw]",
  "lg:top-[14.0625cqw]",
  "lg:top-[16.145833cqw]",
  "lg:top-[18.229167cqw]",
  "lg:top-[20.3125cqw]",
  "lg:top-[22.395833cqw]",
  "lg:top-[24.479167cqw]",
  "lg:top-[26.5625cqw]",
] as const

function sidebarPosition(index: number): string {
  return (
    SIDEBAR_ITEM_POSITIONS[index] ??
    SIDEBAR_ITEM_POSITIONS[SIDEBAR_ITEM_POSITIONS.length - 1]
  )
}

const SORT_LABELS = {
  default: "Default Sorting",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
  rating: "Highest Rated",
} as const

function ProductCard({
  item,
  productIndex,
}: {
  item: CategoryProduct
  productIndex: number
}) {
  const secondaryImage = item.secondaryImage || item.image
  const showSaleDetails = productIndex % 4 === 2 && item.isSale !== false

  return (
    <article className="group relative flex flex-col lg:h-[24.791667cqw] lg:w-[16.666667cqw] lg:block">
      <Link
        href={`/${item.slug || item.id}`}
        className="group/image relative block aspect-square w-full overflow-hidden rounded-[20px] bg-zinc-100 lg:absolute lg:left-0 lg:top-0 lg:h-[16.666667cqw] lg:w-[16.666667cqw] lg:rounded-[1.041667cqw]"
      >
        <Image
          src={item.image}
          alt={item.title}
          fill
          unoptimized
          sizes="(min-width: 1920px) 320px, (min-width: 1024px) 16.667vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover opacity-100 transition-all duration-500 ease-in-out group-hover/image:scale-105 group-hover/image:opacity-0"
        />
        <Image
          src={secondaryImage}
          alt={`${item.title} alternate view`}
          fill
          unoptimized
          sizes="(min-width: 1920px) 320px, (min-width: 1024px) 16.667vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover opacity-0 transition-all duration-500 ease-in-out group-hover/image:scale-105 group-hover/image:opacity-100"
        />

        {showSaleDetails && (
          <span className="absolute right-[10px] top-[10px] z-10 flex h-6 w-16 items-center justify-center rounded-[5px] bg-amber-800 text-xs font-semibold leading-3 tracking-wide text-white shadow-[0_5px_10px_rgba(0,0,0,0.10)] lg:right-auto lg:left-[12.96875cqw] lg:top-[0.520833cqw] lg:h-[1.25cqw] lg:w-[3.333333cqw] lg:rounded-[0.260417cqw] lg:text-[0.625cqw] lg:leading-[0.625cqw]">
            Sale
          </span>
        )}
      </Link>

      <div className="relative mt-3 flex min-h-5 items-start justify-between text-xs lg:absolute lg:left-0 lg:top-[17.708333cqw] lg:mt-0 lg:h-[1.041667cqw] lg:min-h-0 lg:w-full lg:text-[0.625cqw]">
        <div className="flex items-center gap-1.5 lg:absolute lg:left-0 lg:top-0 lg:gap-[0.3125cqw]">
          {showSaleDetails && (
            <span className="font-normal text-neutral-400 line-through">
              Rs.{item.originalPrice.toLocaleString()}
            </span>
          )}
          <span className="font-semibold text-zinc-950">
            Rs.{item.salePrice}
          </span>
        </div>

        <div className="flex items-center lg:absolute lg:left-[7.239583cqw] lg:top-0">
          <span className="font-normal text-neutral-400">Review&nbsp;</span>
          <span className="font-normal text-zinc-950">
            {item.reviewCount}/{item.rating.toFixed(1)}
          </span>
        </div>

        <span className="hidden font-['Times'] text-base font-normal leading-4 tracking-[3px] text-amber-500 sm:inline lg:absolute lg:left-[11.822917cqw] lg:top-[0.052083cqw] lg:block lg:h-[0.729167cqw] lg:w-[5cqw] lg:text-[0.833333cqw] lg:leading-[0.833333cqw] lg:tracking-[0.15625cqw]">
          {"\u2605\u2605\u2605\u2605\u2605"}
        </span>
      </div>

      <h2 className="mt-2 line-clamp-2 text-lg font-bold leading-7 text-black transition-colors group-hover:text-amber-800 sm:text-xl sm:leading-8 lg:absolute lg:left-0 lg:top-[19.0625cqw] lg:mt-0 lg:w-[16.666667cqw] lg:text-[1.041667cqw] lg:leading-[1.666667cqw]">
        {item.title}
      </h2>

      <Link
        href={`/${item.slug || item.id}`}
        className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-[5px] border border-amber-800 px-7 text-sm font-semibold leading-5 text-amber-800 transition-colors hover:bg-amber-800 hover:text-white lg:absolute lg:left-0 lg:top-[22.708333cqw] lg:mt-0 lg:h-[2.083333cqw] lg:w-[16.666667cqw] lg:rounded-[0.260417cqw] lg:px-[1.458333cqw] lg:text-[0.729167cqw] lg:leading-[1.041667cqw]"
      >
        View
      </Link>
    </article>
  )
}

export function CategoryContent({
  initialProducts = [],
  categoryTitle = "All Wallets Category",
  currentSlug,
  sidebarCategories = [],
}: CategoryContentProps) {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState<keyof typeof SORT_LABELS>("default")

  // Products come straight from the database for the selected category —
  // an empty catalog simply shows zero results until the admin adds items.
  const baseProducts = initialProducts

  const processedProducts = useMemo(() => {
    const result = [...baseProducts]

    if (sortBy === "price-asc") {
      result.sort((a, b) => a.salePrice - b.salePrice)
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => b.salePrice - a.salePrice)
    } else if (sortBy === "rating") {
      result.sort((a, b) => b.rating - a.rating)
    }

    return result
  }, [baseProducts, sortBy])

  const visibleProducts = processedProducts.slice(0, 12)

  return (
    <section
      className={`relative mx-auto w-full max-w-[1920px] bg-slate-50 px-4 py-10 font-['Manrope'] [container-type:inline-size] sm:px-6 lg:p-0 ${
        viewMode === "grid"
          ? "lg:h-[87.5cqw] lg:overflow-hidden"
          : "lg:min-h-[87.5cqw]"
      }`}
    >
      <h1 className="sr-only">{categoryTitle}</h1>
      <aside className="mb-8 lg:contents">
        <button
          type="button"
          onClick={() => router.push("/products")}
          className="inline-flex h-10 w-full max-w-80 items-center justify-center rounded-[5px] bg-amber-800 px-7 text-sm font-semibold leading-5 text-white lg:absolute lg:left-[6.25cqw] lg:top-[4.166667cqw] lg:h-[2.083333cqw] lg:w-[16.666667cqw] lg:max-w-none lg:rounded-[0.260417cqw] lg:px-[1.458333cqw] lg:text-[0.729167cqw] lg:leading-[1.041667cqw]"
        >
          {categoryTitle}
        </button>

        {/* Same admin-created categories as the header Our Product dropdown */}
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3 lg:contents">
          {sidebarCategories.map((subcategory, index) => (
            <button
              key={subcategory.id}
              type="button"
              onClick={() => router.push(subcategory.href)}
              className={`text-left text-base font-semibold leading-5 text-amber-800 transition-colors hover:text-amber-600 lg:absolute lg:left-[6.25cqw] lg:text-[0.9375cqw] lg:leading-[1.041667cqw] ${sidebarPosition(index)} ${
                currentSlug === subcategory.handle ? "underline" : ""
              }`}
            >
              <span aria-hidden="true">{"\u203A"}</span>{" "}{subcategory.name}
            </button>
          ))}
        </div>
      </aside>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 lg:contents">
        <div className="flex h-10" role="group" aria-label="Product view">
          <button
            type="button"
            aria-label="Grid view"
            aria-pressed={viewMode === "grid"}
            onClick={() => setViewMode("grid")}
            className={`relative h-10 w-14 rounded-l-[10px] shadow-[0_5px_10px_rgba(0,0,0,0.10)] lg:absolute lg:left-[23.958333cqw] lg:top-[4.166667cqw] lg:h-[2.083333cqw] lg:w-[2.916667cqw] lg:rounded-l-[0.520833cqw] ${
              viewMode === "grid" ? "bg-amber-800" : "border border-amber-800 bg-white"
            }`}
          >
            {[0, 1, 2, 3].map((square) => (
              <span
                key={square}
                className={`absolute h-3 w-3 border-2 ${
                  viewMode === "grid"
                    ? "border-white bg-amber-800"
                    : "border-amber-800 bg-white"
                } ${
                  square % 2 === 0
                    ? "left-[18px] lg:left-[0.9375cqw]"
                    : "left-[29px] lg:left-[1.510417cqw]"
                } ${
                  square < 2
                    ? "top-[8px] lg:top-[0.416667cqw]"
                    : "top-[19px] lg:top-[0.989583cqw]"
                } lg:h-[0.625cqw] lg:w-[0.625cqw] lg:border-[0.104167cqw]`}
              />
            ))}
          </button>

          <button
            type="button"
            aria-label="List view"
            aria-pressed={viewMode === "list"}
            onClick={() => setViewMode("list")}
            className={`relative ml-1 h-10 w-14 rounded-r-[10px] shadow-[0_5px_10px_rgba(0,0,0,0.10)] lg:absolute lg:left-[27.083333cqw] lg:top-[4.166667cqw] lg:ml-0 lg:h-[2.083333cqw] lg:w-[2.916667cqw] lg:rounded-r-[0.520833cqw] ${
              viewMode === "list"
                ? "bg-amber-800"
                : "border-b border-r border-t border-amber-800 bg-white"
            }`}
          >
            {[0, 1].map((bar) => (
              <span
                key={bar}
                className={`absolute left-[18px] h-3 w-6 border-2 lg:left-[0.9375cqw] lg:h-[0.625cqw] lg:w-[1.25cqw] lg:border-[0.104167cqw] ${
                  bar === 0
                    ? "top-[8px] lg:top-[0.416667cqw]"
                    : "top-[19px] lg:top-[0.989583cqw]"
                } ${
                  viewMode === "list"
                    ? "border-white bg-amber-800"
                    : "border-amber-800 bg-white"
                }`}
              />
            ))}
          </button>
        </div>

        <p className="font-['DM_Sans'] text-sm font-normal leading-5 text-black lg:absolute lg:left-[31.25cqw] lg:top-[4.6875cqw] lg:text-[0.729167cqw] lg:leading-[1.041667cqw]">
          Showing {visibleProducts.length ? 1 : 0}{"\u2013"}{visibleProducts.length} of{" "}
          {processedProducts.length} results
        </p>

        <div className="relative h-10 w-64 rounded-[5px] border border-black bg-white lg:absolute lg:left-[80.520833cqw] lg:top-[4.166667cqw] lg:h-[2.083333cqw] lg:w-[13.333333cqw] lg:rounded-[0.260417cqw]">
          <span className="pointer-events-none absolute left-[30px] top-[9px] text-sm font-semibold leading-5 text-black lg:left-[1.5625cqw] lg:top-[0.520833cqw] lg:text-[0.729167cqw] lg:leading-[1.041667cqw]">
            {SORT_LABELS[sortBy]}
          </span>
          <CaretDown className="pointer-events-none absolute left-[204px] top-[9px] h-5 w-5 text-black lg:left-[10.625cqw] lg:top-[0.520833cqw] lg:h-[1.041667cqw] lg:w-[1.041667cqw]" />
          <select
            aria-label="Sort products"
            value={sortBy}
            onChange={(event) =>
              setSortBy(event.target.value as keyof typeof SORT_LABELS)
            }
            className="absolute inset-0 cursor-pointer opacity-0"
          >
            <option value="default">Default Sorting</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:absolute lg:left-[23.958333cqw] lg:top-[7.8125cqw] lg:w-[69.791667cqw] lg:grid-cols-[repeat(4,16.666667cqw)] lg:gap-x-[1.041667cqw] lg:gap-y-[2.083333cqw]">
          {visibleProducts.map((product, index) => (
            <ProductCard key={product.id} item={product} productIndex={index} />
          ))}
        </div>
      ) : (
        <div className="space-y-5 lg:ml-[23.958333cqw] lg:w-[69.791667cqw] lg:pb-[4.166667cqw] lg:pt-[7.8125cqw]">
          {visibleProducts.map((product) => (
            <article
              key={product.id}
              className="group flex flex-col gap-6 rounded-[20px] border border-gray-100 bg-white p-4 shadow-sm sm:flex-row"
            >
              <Link
                href={`/${product.slug || product.id}`}
                className="relative block aspect-square w-full shrink-0 overflow-hidden rounded-[15px] bg-zinc-100 sm:h-48 sm:w-48"
              >
                <Image
                  src={product.image}
                  alt={product.title}
                  fill
                  unoptimized
                  sizes="192px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </Link>
              <div className="flex flex-1 flex-col justify-center gap-3">
                <p className="text-xs text-neutral-400">
                  Review {product.reviewCount}/{product.rating.toFixed(1)}{" "}
                  <span className="font-['Times'] tracking-[3px] text-amber-500">
                    {"\u2605\u2605\u2605\u2605\u2605"}
                  </span>
                </p>
                <h2 className="text-xl font-bold text-black">
                  {product.title}
                </h2>
                <p>
                  <span className="mr-2 text-sm text-neutral-400 line-through">
                    Rs.{product.originalPrice.toLocaleString()}
                  </span>
                  <span className="font-semibold text-black">
                    Rs.{product.salePrice}
                  </span>
                </p>
                <Link
                  href={`/${product.slug || product.id}`}
                  className="inline-flex h-10 w-40 items-center justify-center rounded-[5px] border border-amber-800 text-sm font-semibold text-amber-800 hover:bg-amber-800 hover:text-white"
                >
                  View
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}