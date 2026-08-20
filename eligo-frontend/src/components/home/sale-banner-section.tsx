import Image from "next/image"
import Link from "next/link"
import { SaleCountdown } from "./sale-countdown"


export function SaleBannerSection() {
  return (
    <section className="relative isolate h-[620px] w-full overflow-hidden bg-slate-50 font-['Manrope'] sm:h-[700px] lg:h-[820px] min-[1920px]:h-[920px]!">
      {/* The Figma artboard starts the image at y=86 on a 1920px viewport. */}
      <div className="absolute inset-0 min-[1920px]:inset-x-0! min-[1920px]:bottom-auto! min-[1920px]:top-[86px]! min-[1920px]:h-[833px]!">
        <Image
          src="/images/homepage/14_vector_5.webp"
          alt="Premium leather wallet, belt, keychain, case, and earphone holder"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[68%_center] min-[1920px]:object-fill!"
        />
      </div>

      {/* Adds contrast only where the mobile crop places text over the products. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/30 lg:hidden"
      />

      <div className="relative z-10 mx-auto h-full w-full max-w-[1920px]">
        <div className="absolute left-1/2 top-[110px] flex w-[300px] -translate-x-1/2 flex-col items-center text-center sm:top-[145px] sm:w-[400px] lg:left-20 lg:top-[200px] lg:w-[480px] lg:translate-x-0 xl:left-28 xl:top-[230px] min-[1920px]:left-[170px]! min-[1920px]:top-[267px]! min-[1920px]:w-[528px]!">
          <p className="text-2xl font-normal leading-8 text-yellow-400 sm:text-3xl sm:leading-10 lg:translate-x-[6px] lg:text-4xl lg:leading-[44px] min-[1920px]:text-5xl! min-[1920px]:leading-[50px]!">
            PREMIUM
          </p>

          <h2 className="mt-3 text-5xl font-bold leading-[52px] text-white sm:mt-4 sm:text-6xl sm:leading-[66px] lg:mt-5 lg:text-7xl lg:leading-[78px] min-[1920px]:text-8xl! min-[1920px]:leading-[100px]!">
            LEATHER
            <span className="block text-yellow-400">SALE</span>
          </h2>

          <div className="mt-4 flex h-14 w-60 items-center justify-center gap-3 rounded-[8px] border border-yellow-400 sm:mt-6 sm:h-16 sm:w-64 sm:gap-4 lg:h-[72px] lg:w-[272px] min-[1920px]:mt-[30px]! min-[1920px]:h-20! min-[1920px]:w-72! min-[1920px]:-translate-x-1! min-[1920px]:gap-5! min-[1920px]:rounded-[10px]!">
            <span className="whitespace-nowrap text-sm font-bold leading-5 text-white sm:text-base lg:text-lg min-[1920px]:text-xl! min-[1920px]:leading-8!">
              UP TO
            </span>

            <span className="text-3xl font-normal leading-none text-yellow-400 sm:text-4xl lg:text-[42px] min-[1920px]:text-5xl! min-[1920px]:leading-[50px]!">
              30%
            </span>

            <span className="text-sm font-bold leading-5 text-white sm:text-base lg:text-lg min-[1920px]:text-xl! min-[1920px]:leading-8!">
              OFF
            </span>
          </div>

          <Link
            href="/sales"
            className="mt-3 inline-flex items-center justify-center rounded-[5px] bg-white px-6 py-2 text-xs font-semibold leading-5 text-amber-800 transition-colors hover:bg-amber-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:mt-4 lg:text-sm min-[1920px]:mt-5! min-[1920px]:h-10! min-[1920px]:w-[122px]! min-[1920px]:px-0! min-[1920px]:py-0!"
          >
            Shop Now
          </Link>

          <p className="mt-5 text-sm font-bold leading-6 text-yellow-400 sm:mt-6 sm:text-base lg:text-lg min-[1920px]:mt-[30px]! min-[1920px]:text-xl! min-[1920px]:leading-8!">
            SALE ENDS IN
          </p>

          <div className="mt-3 w-full sm:mt-4 min-[1920px]:mt-[18px]!">
            <SaleCountdown />
          </div>
        </div>
      </div>
    </section>
  )
}