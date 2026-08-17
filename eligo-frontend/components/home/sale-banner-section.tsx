"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"

export function SaleBannerSection() {
  const [timeLeft, setTimeLeft] = useState({
    days: 4,
    hours: 12,
    minutes: 35,
    seconds: 22,
  })

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 }
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 }
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 }
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 }
        }
        return prev
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTwoDigits = (num: number) => String(num).padStart(2, "0")

  return (
    <section suppressHydrationWarning className="relative w-full py-16 lg:py-24 bg-[#5C240E] text-white overflow-hidden font-['Manrope']">
      {/* Background Radial Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#8B4513]/40 via-[#5C240E]/80 to-[#2A0E04] opacity-95" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center justify-between gap-10">
        {/* Left Text & Countdown */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-6 max-w-xl">
          <span className="text-amber-400 text-2xl sm:text-3xl font-bold tracking-widest uppercase">
            PREMIUM
          </span>

          <h2 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold leading-none tracking-tight">
            LEATHER <br />
            <span className="text-amber-400">SALE</span>
          </h2>

          {/* Up to 30% Off Pill */}
          <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-[10px] border border-amber-400/50 bg-black/40 backdrop-blur-xs">
            <span className="text-white text-base font-semibold">UP TO</span>
            <span className="text-amber-400 text-3xl sm:text-4xl font-extrabold">30%</span>
            <span className="text-white text-base font-semibold">OFF</span>
          </div>

          {/* Shop Now CTA Button */}
          <div className="pt-2">
            <Link
              href="/sales"
              className="px-8 py-3.5 bg-white hover:bg-amber-100 text-[#5C240E] font-bold text-sm rounded-[6px] shadow-xl hover:shadow-2xl transition-all duration-300 inline-block"
            >
              Shop Now &rarr;
            </Link>
          </div>

          {/* Countdown Timer Boxes */}
          <div className="pt-4 flex items-center gap-3 sm:gap-4">
            {/* Days */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[10px] border border-amber-400/40 bg-black/50 backdrop-blur-xs flex items-center justify-center shadow-inner">
                <span className="text-amber-400 text-2xl sm:text-3xl font-bold">
                  {formatTwoDigits(timeLeft.days)}
                </span>
              </div>
              <span className="mt-1.5 text-white/80 text-xs">Days</span>
            </div>

            <span className="text-amber-400 text-xl font-bold pb-5">:</span>

            {/* Hours */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[10px] border border-amber-400/40 bg-black/50 backdrop-blur-xs flex items-center justify-center shadow-inner">
                <span className="text-amber-400 text-2xl sm:text-3xl font-bold">
                  {formatTwoDigits(timeLeft.hours)}
                </span>
              </div>
              <span className="mt-1.5 text-white/80 text-xs">Hours</span>
            </div>

            <span className="text-amber-400 text-xl font-bold pb-5">:</span>

            {/* Mins */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[10px] border border-amber-400/40 bg-black/50 backdrop-blur-xs flex items-center justify-center shadow-inner">
                <span className="text-amber-400 text-2xl sm:text-3xl font-bold">
                  {formatTwoDigits(timeLeft.minutes)}
                </span>
              </div>
              <span className="mt-1.5 text-white/80 text-xs">Mins</span>
            </div>

            <span className="text-amber-400 text-xl font-bold pb-5">:</span>

            {/* Secs */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[10px] border border-amber-400/40 bg-black/50 backdrop-blur-xs flex items-center justify-center shadow-inner">
                <span className="text-amber-400 text-2xl sm:text-3xl font-bold">
                  {formatTwoDigits(timeLeft.seconds)}
                </span>
              </div>
              <span className="mt-1.5 text-white/80 text-xs">Secs</span>
            </div>
          </div>
        </div>

        {/* Right Leather Products Display Composition */}
        <div className="relative z-10 w-full lg:w-1/2 h-72 sm:h-96 flex items-center justify-center">
          <div className="relative w-full h-full max-w-lg rounded-[24px] overflow-hidden border-4 border-amber-400/20 shadow-2xl">
            <Image
              src="https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=1000"
              alt="Handcrafted Genuine Leather Products Showcase"
              fill
              unoptimized
              className="object-cover object-center hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </div>
        </div>
      </div>
    </section>
  )
}
