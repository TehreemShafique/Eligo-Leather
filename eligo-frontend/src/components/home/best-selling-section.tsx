import Image from "next/image"
import Link from "next/link"

interface ProductItem {
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
}

const DEFAULT_BEST_SELLERS: ProductItem[] = [
  {
    id: 1,
    title: "ARDOR - Handmade Leather Card Holder Wallet",
    originalPrice: 5199,
    salePrice: 1699,
    rating: 5,
    reviewCount: 35,
    image: "/images/homepage/30_rectangle_1682.webp",
    isSale: true,
  },
  {
    id: 2,
    title: "ARDOR - Handmade Leather Card Holder Wallet",
    originalPrice: 5199,
    salePrice: 1699,
    rating: 5,
    reviewCount: 35,
    image: "/images/homepage/31_rectangle_1682.webp",
  },
  {
    id: 3,
    title: "ARDOR - Handmade Leather Card Holder Wallet",
    originalPrice: 5199,
    salePrice: 1699,
    rating: 5,
    reviewCount: 35,
    image: "/images/homepage/32_rectangle_1682.webp",
  },
  {
    id: 4,
    title: "ARDOR - Handmade Leather Card Holder Wallet",
    originalPrice: 5199,
    salePrice: 1699,
    rating: 5,
    reviewCount: 35,
    image: "/images/homepage/33_rectangle_1682.webp",
    isSale: true,
  },
  {
    id: 5,
    title: "ARDOR - Handmade Leather Card Holder Wallet",
    originalPrice: 5199,
    salePrice: 1699,
    rating: 5,
    reviewCount: 35,
    image: "/images/homepage/34_rectangle_1682.webp",
  },
]

const FALLBACK_SECONDARY_IMAGE = "/images/homepage/26_rectangle_1682.webp"

interface BestSellingSectionProps {
  products?: ProductItem[]
}

export function BestSellingSection({
  products = DEFAULT_BEST_SELLERS,
}: BestSellingSectionProps) {
  const displayItems =
    products.length > 0 ? products.slice(0, 5) : DEFAULT_BEST_SELLERS

  return (
    <section className="overflow-hidden bg-slate-50 py-16 font-['Manrope'] sm:py-20 min-[1920px]:h-[670px] min-[1920px]:pt-[60px] min-[1920px]:pb-[34px]">
      <div className="mx-auto w-full max-w-[1920px] px-4 sm:px-6 lg:px-8 min-[1920px]:px-[120px]">
        <h2 className="mb-10 text-center text-[32px] font-bold leading-tight text-black sm:text-[40px] lg:text-[48px] min-[1920px]:leading-[50px]">
          Best Selling Items
        </h2>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 xl:gap-5 min-[1920px]:grid-cols-[repeat(5,320px)] min-[1920px]:gap-10">
          {displayItems.map((item) => (
            <article key={item.id} className="group relative w-full min-[1920px]:w-80">
              {/* Product image */}
              <Link
                href={`/products/${item.slug || item.id}`}
                className="group/image relative block aspect-square w-full overflow-hidden rounded-[20px] bg-white min-[1920px]:size-80"
              >
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(min-width: 1920px) 320px, (min-width: 1280px) 20vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover opacity-100 transition-all duration-500 ease-in-out group-hover/image:scale-105 group-hover/image:opacity-0"
                />
                <Image
                  src={item.secondaryImage || FALLBACK_SECONDARY_IMAGE}
                  alt={`${item.title} alternate view`}
                  fill
                  sizes="(min-width: 1920px) 320px, (min-width: 1280px) 20vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover opacity-0 transition-all duration-500 ease-in-out group-hover/image:scale-105 group-hover/image:opacity-100"
                />
              </Link>

              {/* Sale badge */}
              {item.isSale && (
                <span className="absolute right-2 top-2 z-10 inline-flex h-6 w-16 items-center justify-center rounded-[5px] border border-white/10 bg-amber-800 text-xs font-semibold leading-3 tracking-wide text-white shadow-[0_5px_10px_rgba(0,0,0,0.10)] min-[1920px]:right-[-13px] min-[1920px]:top-[10px]">
                  Sale
                </span>
              )}

              {/* Price and review row */}
              <div className="mt-4 flex min-h-[16px] items-center justify-between gap-2 text-xs min-[1920px]:relative min-[1920px]:mt-[30px] min-[1920px]:block min-[1920px]:h-[14px] min-[1920px]:min-h-0">
                <div className="flex shrink-0 items-center gap-2 min-[1920px]:absolute min-[1920px]:left-0 min-[1920px]:top-0">
                  {item.isSale && (
                    <span className="text-neutral-400 line-through decoration-amber-800">
                      Rs.{item.originalPrice.toLocaleString("en-US")}
                    </span>
                  )}

                  <span className="font-semibold text-zinc-950">
                    Rs.{item.salePrice}
                  </span>
                </div>

                <div className="ml-auto flex items-center gap-1 min-[1920px]:contents">
                  <span className="whitespace-nowrap min-[1920px]:absolute min-[1920px]:left-[159px] min-[1920px]:top-0">
                    <span className="text-neutral-400">Review </span>

                    <span className="text-zinc-950">
                      {item.reviewCount}/{item.rating.toFixed(1)}
                    </span>
                  </span>

                  <span className="whitespace-nowrap font-['Times'] text-base leading-4 tracking-[3px] text-amber-500 min-[1920px]:absolute min-[1920px]:left-[247px] min-[1920px]:top-px min-[1920px]:w-24">
                    ★★★★★
                  </span>
                </div>
              </div>

              {/* Product title */}
              <h3 className="mt-3 line-clamp-2 text-base font-bold leading-6 text-black transition-colors group-hover:text-amber-800 min-[1920px]:mt-[12px] min-[1920px]:h-16 min-[1920px]:w-80 min-[1920px]:text-xl min-[1920px]:leading-8">
                {item.title}
              </h3>

              {/* View button */}
              <Link
                href={`/products/${item.slug || item.id}`}
                className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-[5px] border border-amber-800 px-7 py-2.5 text-sm font-semibold leading-5 text-amber-800 transition-colors hover:bg-amber-800 hover:text-white min-[1920px]:mt-[6px] min-[1920px]:w-80"
              >
                View
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}