"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"

export function CategoriesSection() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <section suppressHydrationWarning className="py-16 sm:py-20 bg-slate-50 font-['Manrope'] overflow-x-hidden">
      <div suppressHydrationWarning className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div suppressHydrationWarning className="text-center mb-10 sm:mb-12">
          <h2 suppressHydrationWarning className="text-3xl sm:text-4xl lg:text-5xl font-bold text-black tracking-tight">
            Our Categories
          </h2>
        </div>

        {/* 3 Columns Side-by-Side on Desktop: 1fr | 1fr | 2fr (390px | 390px | 820px Ratio) */}
        <div suppressHydrationWarning className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_2fr] gap-6 items-stretch">
          {/* Card 1: Vertical Rectangle (390px x 780px Ratio) */}
          <div className="group relative rounded-[20px] overflow-hidden min-h-[480px] lg:min-h-[680px] xl:min-h-[740px] bg-zinc-100 flex flex-col justify-end p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500">
            <Image
              src="https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&q=80&w=800"
              alt="Handcrafted leather wallets category"
              fill
              unoptimized
              className="object-cover object-top group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <div className="relative z-10 flex justify-center pb-2">
              <Link
                href="/categories/wallets"
                className="px-7 py-2.5 bg-amber-800 hover:bg-amber-900 text-white text-sm font-semibold rounded-[5px] transition-all duration-300 shadow-md inline-flex justify-center items-center gap-2.5"
              >
                Explore Now
              </Link>
            </div>
          </div>

          {/* Card 2: Vertical Rectangle (390px x 780px Ratio) */}
          <div className="group relative rounded-[20px] overflow-hidden min-h-[480px] lg:min-h-[680px] xl:min-h-[740px] bg-zinc-100 flex flex-col justify-end p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500">
            <Image
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800"
              alt="Handmade leather belts category"
              fill
              unoptimized
              className="object-cover object-top group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <div className="relative z-10 flex justify-center pb-2">
              <Link
                href="/categories/belts"
                className="px-7 py-2.5 bg-amber-800 hover:bg-amber-900 text-white text-sm font-semibold rounded-[5px] transition-all duration-300 shadow-md inline-flex justify-center items-center gap-2.5"
              >
                Explore Now
              </Link>
            </div>
          </div>

          {/* Column 3: Stacked 2 Horizontal Cards (820px Wide Ratio) */}
          <div className="flex flex-col justify-between gap-6 lg:min-h-[680px] xl:min-h-[740px]">
            {/* Card 3: Top Horizontal Card */}
            <div className="group relative bg-zinc-100 rounded-[20px] p-6 sm:p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex items-center justify-between overflow-hidden flex-1 min-h-[240px]">
              <div className="max-w-[60%] z-10 space-y-5">
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-black leading-snug group-hover:text-amber-800 transition-colors">
                  Premium Leather Keychain for Everyday Style
                </h3>
                <div>
                  <Link
                    href="/categories/keychains"
                    className="px-7 py-2.5 bg-white border border-amber-800 text-amber-800 hover:bg-amber-800 hover:text-white text-sm font-semibold rounded-[5px] transition-all duration-300 shadow-sm inline-flex justify-center items-center gap-2.5"
                  >
                    Explore Now
                  </Link>
                </div>
              </div>
              {/* Right side 370px x 370px Ratio Image */}
              <div className="relative w-36 h-36 sm:w-56 sm:h-56 lg:w-64 lg:h-64 xl:w-[320px] xl:h-[320px] aspect-square rounded-[20px] overflow-hidden bg-zinc-200 shrink-0">
                <Image
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=800"
                  alt="Premium Leather Keychain"
                  fill
                  unoptimized
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>

            {/* Card 4: Bottom Horizontal Card */}
            <div className="group relative bg-zinc-100 rounded-[20px] p-6 sm:p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex items-center justify-between overflow-hidden flex-1 min-h-[240px]">
              <div className="max-w-[60%] z-10 space-y-5">
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-black leading-snug group-hover:text-amber-800 transition-colors">
                  Premium Leather Cases for Classic Protection
                </h3>
                <div>
                  <Link
                    href="/categories/cases"
                    className="px-7 py-2.5 bg-white border border-amber-800 text-amber-800 hover:bg-amber-800 hover:text-white text-sm font-semibold rounded-[5px] transition-all duration-300 shadow-sm inline-flex justify-center items-center gap-2.5"
                  >
                    Explore Now
                  </Link>
                </div>
              </div>
              {/* Right side 370px x 370px Ratio Image */}
              <div className="relative w-36 h-36 sm:w-56 sm:h-56 lg:w-64 lg:h-64 xl:w-[320px] xl:h-[320px] aspect-square rounded-[20px] overflow-hidden bg-zinc-200 shrink-0">
                <Image
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800"
                  alt="Premium Leather Cases"
                  fill
                  unoptimized
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
