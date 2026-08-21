import Image from "next/image"
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb"

export function ContactHero() {
  return (
    <section className="w-full overflow-hidden bg-slate-50 font-['Manrope']">
      <div className="relative mx-auto w-full max-w-[1920px] px-4 py-12 [container-type:inline-size] sm:px-6 sm:py-16 lg:px-8 xl:h-[41.666667cqw] xl:p-0">
        <PageBreadcrumb label="Contact Us" />

        <h1 className="mb-10 text-4xl font-bold leading-tight text-amber-800 sm:text-5xl xl:absolute xl:left-[6.25cqw] xl:top-[5.208333cqw] xl:mb-0 xl:text-[3.125cqw] xl:leading-[3.645833cqw]">
          Contact Us
        </h1>

        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(280px,384px)_minmax(0,1fr)] lg:gap-10 xl:contents">
          <div className="w-full max-w-lg lg:max-w-none xl:absolute xl:left-[6.25cqw] xl:top-[19.6875cqw] xl:w-[20cqw]">
            <h2 className="text-4xl font-bold leading-tight text-black sm:text-5xl xl:text-[2.5cqw] xl:leading-[2.604167cqw]">
              We&apos;re Here to Help
            </h2>

            <p className="mt-5 text-base font-normal leading-relaxed text-black sm:text-lg xl:mt-[1.041667cqw] xl:text-[0.9375cqw] xl:leading-[1.458333cqw]">
              Whether you have questions about our products, need assistance
              with an order, or simply want to share your feedback, our team is
              always ready to assist you.
            </p>

            <div className="mt-5 flex flex-col items-start gap-[7px] sm:flex-row sm:items-center xl:mt-[1.041667cqw] xl:flex-nowrap xl:gap-[0.364583cqw]">
              <a
                href="#contact-form-section"
                className="inline-flex h-12 w-48 items-center justify-center rounded-[10px] bg-amber-800 text-sm font-semibold text-white transition-colors hover:bg-amber-900 xl:h-[2.5cqw] xl:w-[10cqw] xl:rounded-[0.520833cqw] xl:text-[0.729167cqw]"
              >
                Send Us a Message
              </a>

              <a
                href="tel:+923345399470"
                className="inline-flex h-12 w-52 items-center justify-center rounded-[10px] border border-amber-800 text-sm font-semibold text-amber-800 transition-colors hover:bg-amber-800 hover:text-white xl:h-[2.5cqw] xl:w-[10.833333cqw] xl:rounded-[0.520833cqw] xl:text-[0.729167cqw]"
              >
                Call Customer Support
              </a>
            </div>
          </div>

          <div className="relative h-[350px] w-full overflow-hidden rounded-[20px] border border-amber-800 sm:h-[450px] lg:h-[420px] xl:absolute xl:left-[36.458333cqw] xl:top-[10.9375cqw] xl:h-[28.645833cqw] xl:w-[57.291667cqw] xl:rounded-[1.041667cqw]">
            <Image
              src="/images/Contact_hero.webp"
              alt="Eligo Leather contact support"
              fill
              priority
              sizes="(min-width: 1280px) 57.3vw, (min-width: 1024px) 60vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  )
}