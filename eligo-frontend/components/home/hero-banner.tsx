"use client"

import Image from "next/image"

export function HeroBanner() {
  return (
    <section className="relative w-full min-h-[500px] sm:min-h-[580px] lg:min-h-[640px] bg-neutral-950 overflow-hidden flex items-center font-['Manrope']">
      {/* Hero Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/homepage/sec1.png"
          alt="ELIGO Leather Products Showcase"
          fill
          priority
          unoptimized
          className="object-cover object-center opacity-90 brightness-95"
        />
        {/* Dark Gradient Overlay for optimal legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-transparent" />
      </div>

      {/* Hero Text Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="max-w-2xl space-y-5">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.15] tracking-tight">
            ELIGO Leather Products for Keychains, Cases, Wallets, and Belts
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-gray-200 font-normal leading-relaxed max-w-xl">
            Premium handmade essentials designed for those who carry status, not just style. Built with real leather, made to stand out every day.
          </p>
        </div>
      </div>
    </section>
  )
}
