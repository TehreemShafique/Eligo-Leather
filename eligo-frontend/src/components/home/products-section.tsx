"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { CaretDown, SquaresFour } from "@phosphor-icons/react"

interface Product {
  id: string | number
  slug?: string
  title: string
  category: string
  originalPrice: number
  salePrice: number
  rating: number
  reviewCount: number
  image: string
  secondaryImage?: string
  isSale?: boolean
  strikeOriginalPrice?: boolean
}

const PRODUCTS_CATALOG: Product[] = [
  {
    id: 1,
    title: "ARDOR - Handmade Leather Card Holder Wallet",
    category: "Wallets",
    originalPrice: 5199,
    salePrice: 1699,
    rating: 5,
    reviewCount: 35,
    image: "/images/homepage/26_rectangle_1682.webp",
    secondaryImage: "/images/homepage/30_rectangle_1682.webp",
    isSale: true,
    strikeOriginalPrice: true,
  },
  {
    id: 2,
    title: "ARDOR - Handmade Leather Card Holder Wallet",
    category: "Wallets",
    originalPrice: 5199,
    salePrice: 1699,
    rating: 5,
    reviewCount: 35,
    image: "/images/homepage/25_rectangle_1682.webp",
    secondaryImage: "/images/homepage/31_rectangle_1682.webp",
  },
  {
    id: 3,
    title: "ARDOR - Handmade Leather Card Holder Wallet",
    category: "Cases",
    originalPrice: 5199,
    salePrice: 1699,
    rating: 5,
    reviewCount: 35,
    image: "/images/homepage/27_rectangle_1682.webp",
    secondaryImage: "/images/homepage/32_rectangle_1682.webp",
  },
  {
    id: 4,
    title: "ARDOR - Handmade Leather Card Holder Wallet",
    category: "Belts",
    originalPrice: 5199,
    salePrice: 1699,
    rating: 5,
    reviewCount: 35,
    image: "/images/homepage/28_rectangle_1682.webp",
    secondaryImage: "/images/homepage/33_rectangle_1682.webp",
    isSale: true,
  },
  {
    id: 5,
    title: "ARDOR - Handmade Leather Card Holder Wallet",
    category: "Keychains",
    originalPrice: 5199,
    salePrice: 1699,
    rating: 5,
    reviewCount: 35,
    image: "/images/homepage/29_rectangle_1682.webp",
    secondaryImage: "/images/homepage/34_rectangle_1682.webp",
  },
]

const CATEGORIES = ["All", "Wallets", "Keychains", "Cases", "Belts"]

const PRODUCT_LEFT_POSITIONS = [
  "lg:left-[6.25cqw]",
  "lg:left-[25cqw]",
  "lg:left-[43.75cqw]",
  "lg:left-[62.5cqw]",
  "lg:left-[81.25cqw]",
] as const

const FALLBACK_SECONDARY_IMAGE =
  "/images/homepage/30_rectangle_1682.webp"

export function ProductsSection({
  initialProducts = PRODUCTS_CATALOG,
}: {
  initialProducts?: Product[]
}) {
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDropdownOpen(false)
    }

    document.addEventListener("pointerdown", closeOnOutsideClick)
    document.addEventListener("keydown", closeOnEscape)

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick)
      document.removeEventListener("keydown", closeOnEscape)
    }
  }, [])

  const filteredProducts =
    selectedCategory === "All"
      ? initialProducts
      : initialProducts.filter(
          (product) =>
            product.category.toLowerCase() === selectedCategory.toLowerCase(),
        )

  return (
    <section className="w-full font-['Manrope']">
      <div className="mx-auto w-full max-w-[1920px] [container-type:inline-size]">
        <div className="relative px-4 py-16 sm:px-6 sm:py-20 lg:h-[35.416667cqw] lg:overflow-hidden lg:p-0">
          <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between lg:pointer-events-none lg:absolute lg:inset-0 lg:z-30 lg:mb-0 lg:block">
            <h2 className="text-3xl font-bold leading-tight text-black sm:text-4xl lg:absolute lg:left-[6.25cqw] lg:top-[4.635417cqw] lg:text-[2.5cqw] lg:leading-[2.604167cqw]">
              Our Products
            </h2>

            <div className="flex items-center gap-3 lg:absolute lg:inset-0 lg:block">
              <Link
                href="/products"
                className="pointer-events-auto inline-flex h-10 items-center justify-center gap-2.5 rounded-[5px] bg-amber-800 px-7 text-sm font-semibold leading-5 text-white transition-opacity duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-800 focus-visible:ring-offset-2 lg:absolute lg:left-[75.416667cqw] lg:top-[4.895833cqw] lg:h-[2.083333cqw] lg:gap-[0.520833cqw] lg:rounded-[0.260417cqw] lg:px-[1.458333cqw] lg:text-[0.729167cqw] lg:leading-[1.041667cqw]"
              >
                View All
              </Link>

              <div
                ref={dropdownRef}
                onMouseEnter={() => setDropdownOpen(true)}
                onMouseLeave={() => setDropdownOpen(false)}
                className="pointer-events-auto relative z-40 lg:absolute lg:left-[82.239583cqw] lg:top-[4.895833cqw]"
              >
                <button
                  type="button"
                  aria-expanded={dropdownOpen}
                  aria-haspopup="menu"
                  aria-controls="product-category-menu"
                  onClick={() => setDropdownOpen((open) => !open)}
                  className={`group inline-flex h-10 items-center justify-center gap-2.5 rounded-[5px] border border-amber-800 bg-white px-7 text-sm font-semibold leading-5 text-amber-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-800 focus-visible:ring-offset-2 lg:h-[2.083333cqw] lg:gap-[0.520833cqw] lg:rounded-[0.260417cqw] lg:border-0 lg:bg-transparent lg:px-[1.458333cqw] lg:text-[0.729167cqw] lg:leading-[1.041667cqw] lg:outline lg:outline-1 lg:outline-offset-[-1px] lg:outline-amber-800`}
                >
                  <SquaresFour className="h-4 w-4 shrink-0 lg:h-[0.833333cqw] lg:w-[0.833333cqw]" />
                  <span>
                    {selectedCategory === "All"
                      ? "Select Category"
                      : selectedCategory}
                  </span>
                  <CaretDown className={`h-4 w-4 shrink-0 transition-transform duration-200 lg:h-[0.833333cqw] lg:w-[0.833333cqw] ${dropdownOpen ? "rotate-180" : "group-hover:rotate-180"}`} />
                </button>

                {dropdownOpen && (
                  <div
                    id="product-category-menu"
                    role="menu"
                    className="absolute right-0 z-[60] mt-2 w-48 rounded-xl border border-gray-100 bg-white py-2 shadow-xl lg:mt-[0.416667cqw] lg:w-[10cqw] lg:rounded-[0.625cqw] lg:py-[0.416667cqw]"
                  >
                    {CATEGORIES.map((category) => (
                      <button
                        key={category}
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setSelectedCategory(category)
                          setDropdownOpen(false)
                        }}
                        className={`w-full px-4 py-2.5 text-left text-xs font-semibold transition-all focus-visible:bg-amber-50 focus-visible:text-amber-800 focus-visible:outline-none lg:px-[0.833333cqw] lg:py-[0.416667cqw] lg:text-[0.625cqw] ${
                          selectedCategory === category
                            ? "bg-amber-50 font-bold text-amber-800"
                            : "text-gray-700 hover:bg-gray-50 hover:text-amber-800"
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:absolute lg:inset-0 lg:block">
            {filteredProducts.slice(0, 5).map((item, index) => {
              const secondaryImage =
                item.secondaryImage || FALLBACK_SECONDARY_IMAGE

              return (
                <article
                  key={item.id}
                  className={`group relative flex flex-col justify-between rounded-[20px] border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-xl lg:absolute lg:top-[9.322917cqw] lg:h-[25.3125cqw] lg:w-[16.666667cqw] lg:block lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none lg:hover:shadow-none ${PRODUCT_LEFT_POSITIONS[index]}`}
                >
                  <Link
                    href={`/products/${item.slug || item.id}`}
                    className="group/image relative mb-3.5 block aspect-square w-full overflow-hidden rounded-[20px] bg-zinc-100 lg:absolute lg:left-0 lg:top-0 lg:mb-0 lg:h-[16.666667cqw] lg:w-[16.666667cqw] lg:rounded-[1.041667cqw]"
                  >
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover opacity-100 transition-all duration-500 ease-in-out group-hover/image:scale-105 group-hover/image:opacity-0"
                    />
                    <Image
                      src={secondaryImage}
                      alt={`${item.title} alternate view`}
                      fill
                      className="object-cover opacity-0 transition-all duration-500 ease-in-out group-hover/image:scale-105 group-hover/image:opacity-100"
                    />
                  </Link>

                  {item.isSale && (
                    <div className="absolute right-1 top-7 z-10 flex h-6 w-16 items-center justify-center rounded-[5px] border border-white/10 bg-amber-800 text-xs font-semibold leading-3 tracking-wide text-white shadow-[0px_5px_10px_0px_rgba(0,0,0,0.10)] lg:left-[14.010417cqw] lg:right-auto lg:top-[0.520833cqw] lg:h-[1.25cqw] lg:w-[3.333333cqw] lg:block lg:rounded-[0.260417cqw] lg:text-[0.625cqw] lg:leading-[0.625cqw]">
                      <span className="lg:absolute lg:left-[0.834896cqw] lg:top-[0.3125cqw]">
                        Sale
                      </span>
                    </div>
                  )}

                  <div className="mb-2 flex items-center justify-between text-xs lg:absolute lg:left-0 lg:top-[18.229167cqw] lg:mb-0 lg:block lg:h-[0.833333cqw] lg:w-[16.666667cqw] lg:text-[0.625cqw]">
                    <div className="flex items-center gap-1.5 lg:contents">
                      {item.isSale && (
                        <>
                          <span className="text-neutral-400 lg:absolute lg:left-0 lg:top-0 lg:text-[0.625cqw]">
                            Rs.{item.originalPrice.toLocaleString()}
                          </span>
                          {item.strikeOriginalPrice && (
                            <span
                              aria-hidden="true"
                              className="hidden bg-amber-800 lg:absolute lg:left-0 lg:top-[0.46875cqw] lg:block lg:h-px lg:w-[2.291667cqw]"
                            />
                          )}
                        </>
                      )}

                      <span
                        className={`font-semibold text-zinc-950 lg:absolute lg:top-0 lg:text-[0.625cqw] ${
                          item.isSale
                            ? "lg:left-[2.916667cqw]"
                            : "lg:left-0"
                        }`}
                      >
                        Rs.{item.salePrice}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 lg:contents">
                      <div className="lg:absolute lg:left-[8.28125cqw] lg:top-0 lg:whitespace-nowrap">
                        <span className="font-normal text-neutral-400">
                          Review{" "}
                        </span>
                        <span className="font-normal text-zinc-950">
                          {item.reviewCount}/{item.rating.toFixed(1)}
                        </span>
                      </div>

                      <span className="font-['Times'] text-amber-500 lg:absolute lg:left-[12.864583cqw] lg:top-[0.052083cqw] lg:h-[0.729167cqw] lg:w-[5cqw] lg:text-[0.833333cqw] lg:font-normal lg:leading-[0.833333cqw] lg:tracking-[0.15625cqw]">
                        ★★★★★
                      </span>
                    </div>
                  </div>

                  <h3 className="mb-4 line-clamp-2 text-sm font-bold leading-snug text-black transition-colors group-hover:text-amber-800 lg:absolute lg:left-0 lg:top-[19.583333cqw] lg:mb-0 lg:w-[16.666667cqw] lg:text-[1.041667cqw] lg:leading-[1.666667cqw]">
                    {item.title}
                  </h3>

                  <Link
                    href={`/products/${item.slug || item.id}`}
                    className="inline-flex w-full items-center justify-center rounded-[5px] border border-amber-800 px-4 py-2.5 text-center text-sm font-semibold text-amber-800 transition-colors hover:bg-amber-800 hover:text-white lg:absolute lg:left-0 lg:top-[23.229167cqw] lg:h-[2.083333cqw] lg:w-[16.666667cqw] lg:rounded-[0.260417cqw] lg:px-[1.458333cqw] lg:py-0 lg:text-[0.729167cqw] lg:leading-[1.041667cqw]"
                  >
                    View
                  </Link>
                </article>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}