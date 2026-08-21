import Image from "next/image"

export function HeroBanner() {
  return (
    <section className="relative isolate h-[clamp(560px,100svh,700px)] w-full overflow-hidden bg-black font-['Manrope']">
      {/* Responsive background */}
      <Image
        src="/images/homepage/sec1.png"
        alt="ELIGO leather keychains, cases, wallets, and belts"
        fill
        priority
        unoptimized
        sizes="100vw"
        className="object-cover object-[70%_center] sm:object-[65%_center] lg:object-center"
      />

      {/* Improves readability on mobile and tablet only */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/65 to-black/5 md:bg-gradient-to-r md:from-black/90 md:via-black/45 md:to-transparent xl:hidden" />

      {/* Content container */}
      <div className="relative z-10 mx-auto flex h-full w-full max-w-[1920px] items-end px-[clamp(20px,6.25vw,120px)] pb-[clamp(36px,8vw,64px)] md:items-center md:pb-0">
        <div className="w-full sm:max-w-[580px] md:max-w-[min(52vw,674px)]">
          <h1 className="text-[clamp(34px,3.125vw,60px)] font-bold leading-[1.1667] text-white">
            ELIGO Leather Products for Keychains, Cases, Wallets, and Belts
          </h1>

          <p className="mt-[clamp(22px,1.5625vw,30px)] max-w-[674px] text-[clamp(15px,1.0417vw,20px)] font-normal leading-[1.4] text-white">
            Premium handmade essentials designed for those who carry status,
            not just style.
            <span className="block">
              Built with real leather, made to stand out every day.
            </span>
          </p>
        </div>
      </div>
    </section>
  )
}