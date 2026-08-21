import Image from "next/image"
import Link from "next/link"

export function CategoriesSection() {
  return (
    <section className="overflow-hidden bg-slate-50 pt-16 pb-16 font-['Manrope'] min-[1800px]:pt-[80px] min-[1800px]:pb-[50px]">
      <div className="mx-auto w-full max-w-[1680px] px-4 sm:px-6 lg:px-8 min-[1800px]:px-0">
        {/* Heading */}
        <h2 className="mb-10 text-center text-[32px] font-bold leading-tight text-black sm:text-[40px] min-[1800px]:text-[48px] min-[1800px]:leading-[50px]">
          Our Categories
        </h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-[1fr_1fr_2.135fr] xl:gap-[clamp(24px,2.3958vw,46px)] min-[1800px]:grid-cols-[384px_384px_820px] min-[1800px]:gap-[46px]">
          {/* Wallets */}
          <article className="relative h-[560px] overflow-hidden rounded-[20px] bg-zinc-100 sm:h-[680px] xl:aspect-[384/780] xl:h-auto min-[1800px]:h-[780px] min-[1800px]:aspect-auto">
            <Image
              src="/images/homepage/10_rectangle_1668.webp"
              alt="Man displaying a premium leather wallet"
              fill
              sizes="(min-width: 1800px) 384px, (min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw"
              className="object-contain object-bottom"
            />

            <Link
              href="/categories/wallets"
              className="absolute bottom-10 left-1/2 z-10 inline-flex -translate-x-1/2 items-center justify-center whitespace-nowrap rounded-[5px] bg-amber-800 px-7 py-2.5 text-sm font-semibold leading-5 text-white transition-colors hover:bg-amber-900"
            >
              Explore Now
            </Link>
          </article>

          {/* Belts */}
          <article className="relative h-[560px] overflow-hidden rounded-[20px] bg-zinc-100 sm:h-[680px] xl:aspect-[384/780] xl:h-auto min-[1800px]:h-[780px] min-[1800px]:aspect-auto">
            <Image
              src="/images/homepage/11_rectangle_1669.webp"
              alt="Man displaying a premium leather belt"
              fill
              sizes="(min-width: 1800px) 384px, (min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw"
              className="object-contain object-bottom"
            />

            <Link
              href="/categories/belts"
              className="absolute bottom-10 left-1/2 z-10 inline-flex -translate-x-1/2 items-center justify-center whitespace-nowrap rounded-[5px] bg-amber-800 px-7 py-2.5 text-sm font-semibold leading-5 text-white transition-colors hover:bg-amber-900"
            >
              Explore Now
            </Link>
          </article>

          {/* Horizontal cards */}
          <div className="flex flex-col gap-6 md:col-span-2 xl:col-span-1 xl:gap-[clamp(24px,2.0833vw,40px)] min-[1800px]:h-[780px] min-[1800px]:gap-10">
            {/* Keychains */}
            <article className="relative h-[320px] overflow-hidden rounded-[20px] bg-zinc-100 sm:h-[350px] xl:h-auto xl:flex-1 min-[1800px]:h-[370px] min-[1800px]:flex-none">
              <div className="absolute right-[-14px] top-0 aspect-square h-[calc(100%+14px)] overflow-hidden rounded-[20px]">
                <Image
                  src="/images/homepage/8_rectangle_1670.webp"
                  alt="Man holding a premium leather keychain"
                  fill
                  sizes="(min-width: 1800px) 384px, 45vw"
                  className="object-contain object-bottom"
                />
              </div>

              <div className="absolute inset-0 z-[1] bg-gradient-to-r from-zinc-100 from-45% via-zinc-100/90 to-transparent xl:hidden" />

              <div className="absolute left-[6.1%] top-[20%] z-10 w-[55%] sm:top-[22%] sm:w-[48%] xl:top-[24.324%] xl:w-[39.024%] min-[1800px]:left-[50px] min-[1800px]:top-[90px] min-[1800px]:w-[320px]">
                <h3 className="text-[24px] font-bold leading-[1.12] text-black xl:text-[clamp(28px,1.875vw,36px)] min-[1800px]:text-[36px] min-[1800px]:leading-[40px]">
                  Premium Leather Keychain for Everyday Style
                </h3>

                <Link
                  href="/categories/keychains"
                  className="mt-6 inline-flex items-center justify-center whitespace-nowrap rounded-[5px] border border-amber-800 px-7 py-2.5 text-sm font-semibold leading-5 text-amber-800 transition-colors hover:bg-amber-800 hover:text-white xl:mt-[clamp(24px,1.5625vw,30px)] min-[1800px]:mt-[30px]"
                >
                  Explore Now
                </Link>
              </div>
            </article>

            {/* Cases */}
            <article className="relative h-[320px] overflow-hidden rounded-[20px] bg-zinc-100 sm:h-[350px] xl:h-auto xl:flex-1 min-[1800px]:h-[370px] min-[1800px]:flex-none">
              <div className="absolute right-[-14px] top-0 aspect-square h-[calc(100%+14px)] overflow-hidden rounded-[20px]">
                <Image
                  src="/images/homepage/9_rectangle_1671.webp"
                  alt="Man holding a premium leather case"
                  fill
                  sizes="(min-width: 1800px) 384px, 45vw"
                  className="object-contain object-bottom"
                />
              </div>

              <div className="absolute inset-0 z-[1] bg-gradient-to-r from-zinc-100 from-45% via-zinc-100/90 to-transparent xl:hidden" />

              <div className="absolute left-[6.1%] top-[20%] z-10 w-[55%] sm:top-[22%] sm:w-[48%] xl:top-[24.324%] xl:w-[39.024%] min-[1800px]:left-[50px] min-[1800px]:top-[90px] min-[1800px]:w-[320px]">
                <h3 className="text-[24px] font-bold leading-[1.12] text-black xl:text-[clamp(28px,1.875vw,36px)] min-[1800px]:text-[36px] min-[1800px]:leading-[40px]">
                  Premium Leather Cases for Classic Protection
                </h3>

                <Link
                  href="/categories/cases"
                  className="mt-6 inline-flex items-center justify-center whitespace-nowrap rounded-[5px] border border-amber-800 px-7 py-2.5 text-sm font-semibold leading-5 text-amber-800 transition-colors hover:bg-amber-800 hover:text-white xl:mt-[clamp(24px,1.5625vw,30px)] min-[1800px]:mt-[30px]"
                >
                  Explore Now
                </Link>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  )
}