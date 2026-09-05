import Image from "next/image"
import { NewsletterForm } from "./newsletter-form"

export function NewsletterSection() {
  return (
    <section className="w-full overflow-hidden bg-slate-50 font-['Manrope']">
      <div className="mx-auto w-full max-w-[1920px] [container-type:inline-size]">
        <div className="relative px-4 py-12 sm:px-6 sm:py-16 lg:h-[36.458333cqw] lg:p-0">
          <div className="relative mx-auto flex max-w-3xl flex-col overflow-hidden rounded-[20px] bg-black px-7 py-10 text-white sm:px-10 sm:py-12 lg:absolute lg:left-[6.25cqw] lg:top-[5.104167cqw] lg:block lg:h-[27.604167cqw] lg:w-[87.5cqw] lg:max-w-none lg:overflow-visible lg:rounded-[1.041667cqw] lg:p-0">
            <h2 className="relative z-10 text-3xl font-bold leading-tight sm:text-4xl lg:absolute lg:left-[5.208333cqw] lg:top-[4.207292cqw] lg:w-[34.6875cqw] lg:text-[2.5cqw] lg:leading-[2.604167cqw]">
              Stay Updated With Our Latest Leather Deals
            </h2>

            <p className="relative z-10 mt-6 text-base font-normal leading-relaxed text-white sm:text-lg lg:absolute lg:left-[5.208333cqw] lg:top-[10.978125cqw] lg:mt-0 lg:w-[34.6875cqw] lg:text-[1.041667cqw] lg:leading-[1.458333cqw]">
              Subscribe to our newsletter and get updates about new leather
              products, special offers, seasonal sales, and exclusive
              discounts. Be the first to see our latest wallets, belts,
              keychains, glasses covers, and more.
            </p>

            <NewsletterForm />

            <div className="relative z-0 mt-9 aspect-[684/515] w-full origin-top-left lg:absolute lg:left-[42.8125cqw] lg:top-[1.220313cqw] lg:mt-0 lg:h-[26.822917cqw] lg:w-[35.625cqw] lg:rotate-[-10.74deg]">
              <Image
                src="/images/homepage/15_rectangle_1684.webp"
                alt="Eligo Leather storefront displayed on a laptop"
                fill
                sizes="(min-width: 1920px) 684px, (min-width: 1024px) 35.625vw, 100vw"
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}