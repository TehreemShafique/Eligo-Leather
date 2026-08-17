"use client"

import Link from "next/link"
import Image from "next/image"

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

const DEFAULT_BEST_SELLERS: ProductItem[] = [
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
    title: "ARDOR - Handmade Leather Card Holder Wallet",
    originalPrice: 5199,
    salePrice: 1699,
    rating: 5.0,
    reviewCount: 35,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=600",
    secondaryImage: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=600",
    isSale: false,
  },
  {
    id: 3,
    title: "ARDOR - Handmade Leather Card Holder Wallet",
    originalPrice: 5199,
    salePrice: 1699,
    rating: 5.0,
    reviewCount: 35,
    image: "https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&q=80&w=600",
    secondaryImage: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=600",
    isSale: false,
  },
  {
    id: 4,
    title: "ARDOR - Handmade Leather Card Holder Wallet",
    originalPrice: 5199,
    salePrice: 1699,
    rating: 5.0,
    reviewCount: 35,
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=600",
    secondaryImage: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=600",
    isSale: true,
  },
  {
    id: 5,
    title: "ARDOR - Handmade Leather Card Holder Wallet",
    originalPrice: 5199,
    salePrice: 1699,
    rating: 5.0,
    reviewCount: 35,
    image: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=600",
    secondaryImage: "https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&q=80&w=600",
    isSale: false,
  },
]

export function BestSellingSection({ products = DEFAULT_BEST_SELLERS }: { products?: ProductItem[] }) {
  const displayItems = products.length > 0 ? products : DEFAULT_BEST_SELLERS

  return (
    <section className="py-16 sm:py-20 bg-slate-50 font-['Manrope']">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Centered Heading with no subtext as in Pic 2 */}
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-black tracking-tight">
            Best Selling Items
          </h2>
        </div>

        {/* 5-Column Product Grid with 340x340 Square Product Images */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {displayItems.slice(0, 5).map((item) => {
            const secondaryImg =
              item.secondaryImage ||
              "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=600"

            return (
              <div
                key={item.id}
                className="group bg-white rounded-[20px] border border-gray-100 p-4 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Square Image Container (340x340 aspect ratio) */}
                  <Link
                    href={`/products/${item.id}`}
                    className="group/img relative block aspect-square w-full bg-zinc-100 rounded-[20px] overflow-hidden mb-3.5 cursor-pointer"
                  >
                    {/* Primary Image */}
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      unoptimized
                      className="object-cover opacity-100 group-hover/img:opacity-0 group-hover:opacity-0 group-hover/img:scale-105 group-hover:scale-105 transition-all duration-500 ease-in-out"
                    />
                    {/* Secondary Image on Hover */}
                    <Image
                      src={secondaryImg}
                      alt={`${item.title} alternate view`}
                      fill
                      unoptimized
                      className="object-cover opacity-0 group-hover/img:opacity-100 group-hover:opacity-100 group-hover/img:scale-105 group-hover:scale-105 transition-all duration-500 ease-in-out"
                    />

                    {/* Sale Badge */}
                    {item.isSale && (
                      <div className="absolute top-3 right-3 bg-amber-800 text-white text-xs font-semibold px-2.5 py-0.5 rounded-[5px] shadow-sm z-10">
                        Sale
                      </div>
                    )}
                  </Link>

                  {/* Pricing & Review Line */}
                  <div className="flex items-center justify-between text-xs mb-2">
                    <div className="flex items-center gap-1.5 font-['Manrope']">
                      <span className="text-neutral-400 text-xs line-through">
                        Rs.{item.originalPrice.toLocaleString()}
                      </span>
                      <span className="text-zinc-950 text-xs font-semibold">
                        Rs.{item.salePrice.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px]">
                      <span className="text-neutral-400">Review</span>
                      <span className="text-zinc-950 font-medium">35/5.0</span>
                      <span className="text-amber-500">★★★★★</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-bold text-black leading-snug line-clamp-2 mb-4 group-hover:text-amber-800 transition-colors">
                    {item.title}
                  </h3>
                </div>

                {/* View Action Button */}
                <Link
                  href={`/products/${item.id}`}
                  className="w-full py-2.5 px-4 rounded-[5px] border border-amber-800 text-amber-800 text-sm font-semibold text-center hover:bg-amber-800 hover:text-white transition-all duration-300 inline-block font-['Manrope'] shadow-xs"
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
