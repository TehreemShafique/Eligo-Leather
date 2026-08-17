"use client"

import Link from "next/link"
import Image from "next/image"
import { Star } from "@phosphor-icons/react"

interface ProductItem {
  id: string | number
  title: string
  originalPrice: number
  salePrice: number
  rating: number
  reviewCount: number
  image: string
  secondaryImage?: string
  isSale?: boolean
}

const DEFAULT_RELATED_PRODUCTS: ProductItem[] = [
  {
    id: 1,
    title: "ARDOR - Handmade Leather Card Holder Wallet",
    originalPrice: 5199,
    salePrice: 1699,
    rating: 5.0,
    reviewCount: 35,
    image: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=600",
    secondaryImage: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=600",
    isSale: true,
  },
  {
    id: 2,
    title: "HERALD - Handmade RFID Leather Bifold Wallet",
    originalPrice: 4999,
    salePrice: 1699,
    rating: 5.0,
    reviewCount: 42,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=600",
    secondaryImage: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=600",
    isSale: true,
  },
  {
    id: 3,
    title: "VANGUARD - Full Grain Leather Keychain Loop",
    originalPrice: 3200,
    salePrice: 1299,
    rating: 4.9,
    reviewCount: 28,
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=600",
    secondaryImage: "https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&q=80&w=600",
    isSale: true,
  },
  {
    id: 4,
    title: "TITAN - Handmade Leather Glasses Protective Case",
    originalPrice: 3800,
    salePrice: 1499,
    rating: 5.0,
    reviewCount: 19,
    image: "https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&q=80&w=600",
    secondaryImage: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=600",
    isSale: true,
  },
  {
    id: 5,
    title: "SOLO - Slim Handmade Minimalist Leather Sleeve",
    originalPrice: 4500,
    salePrice: 1699,
    rating: 4.8,
    reviewCount: 31,
    image: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=600",
    secondaryImage: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=600",
    isSale: true,
  },
]

export function RelatedProducts({ products = DEFAULT_RELATED_PRODUCTS }: { products?: ProductItem[] }) {
  const displayItems = products.length > 0 ? products : DEFAULT_RELATED_PRODUCTS

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
          {displayItems.slice(0, 5).map((item) => {
            const secondaryImg =
              item.secondaryImage ||
              "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=600"

            return (
              <div
                key={item.id}
                className="group bg-white rounded-[20px] border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Image Container */}
                  <Link
                    href={`/products/${item.id}`}
                    className="group/img relative block h-64 w-full bg-zinc-100 rounded-[20px] overflow-hidden mb-4 cursor-pointer"
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
                      <div className="absolute top-3 right-3 bg-amber-800 text-white text-xs font-semibold px-2.5 py-1 rounded-[5px] shadow-sm z-10">
                        Sale
                      </div>
                    )}
                  </Link>

                {/* Rating */}
                <div className="flex items-center justify-between text-xs mb-2">
                  <div className="flex items-center text-amber-500 gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} weight="fill" className="w-3.5 h-3.5" />
                    ))}
                  </div>
                  <div className="text-gray-500 font-['Manrope']">
                    Review <span className="text-black font-medium">{item.reviewCount}/{item.rating.toFixed(1)}</span>
                  </div>
                </div>

                {/* Pricing */}
                <div className="flex items-center gap-2 mb-2 font-['Manrope']">
                  <span className="text-xs text-gray-400 line-through">
                    Rs.{item.originalPrice.toLocaleString()}
                  </span>
                  <span className="text-sm font-bold text-zinc-950">
                    Rs.{item.salePrice.toLocaleString()}
                  </span>
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
          )})}
        </div>
      </div>
    </section>
  )
}
