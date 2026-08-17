"use client"

import { useState } from "react"
import Image from "next/image"
import { Envelope } from "@phosphor-icons/react"
import { toast } from "sonner"

export function NewsletterSection() {
  const [email, setEmail] = useState("")

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    toast.success("Thank you for subscribing to Eligo Leather updates!")
    setEmail("")
  }

  return (
    <section className="py-16 sm:py-20 bg-slate-50 font-['Manrope']">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-black rounded-[24px] text-white overflow-hidden p-8 sm:p-12 lg:p-16 flex flex-col lg:flex-row items-center justify-between gap-12 shadow-2xl">
          {/* Left Text & Input */}
          <div className="max-w-xl space-y-6 z-10">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
              Stay Updated With Our Latest Leather Deals
            </h2>
            <p className="text-gray-300 text-sm sm:text-base font-normal leading-relaxed">
              Subscribe to our newsletter to receive exclusive offers, new product arrivals, handcrafted leather care tips, and flash sale discounts directly to your inbox.
            </p>

            {/* Email Subscription Input Pill */}
            <form onSubmit={handleSubscribe} className="pt-2">
              <div className="relative bg-white rounded-full p-1.5 flex items-center shadow-xl border border-neutral-200">
                <div className="pl-4 text-gray-400">
                  <Envelope className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full bg-transparent px-3 py-2 text-black text-sm font-medium focus:outline-hidden placeholder:text-neutral-400"
                />
                <button
                  type="submit"
                  className="px-7 py-3 bg-black hover:bg-[#7A3E1D] text-white text-xs font-bold rounded-full transition-colors duration-300 shrink-0 shadow-md"
                >
                  Subscribe
                </button>
              </div>
            </form>
          </div>

          {/* Right Side: Laptop Mockup Displaying Storefront (Matching Figma Screenshot) */}
          <div className="relative z-10 shrink-0 w-full lg:w-[480px] flex justify-center items-center">
            {/* Laptop Frame */}
            <div className="relative w-full max-w-[440px]">
              {/* Laptop Screen Header / Bezel */}
              <div className="relative bg-neutral-900 rounded-t-[14px] p-2 border-2 border-neutral-700 shadow-2xl overflow-hidden">
                {/* Camera dot */}
                <div className="w-2 h-2 bg-neutral-700 rounded-full mx-auto mb-1.5" />
                {/* Screen Display Container */}
                <div className="relative w-full h-[220px] sm:h-[250px] rounded-[6px] overflow-hidden bg-black border border-neutral-800">
                  <Image
                    src="/images/homepage/sec1.png"
                    alt="Eligo Leather Storefront on Laptop"
                    fill
                    unoptimized
                    className="object-cover object-top hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 text-white text-[11px] font-bold bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-[6px] border border-white/10 flex justify-between items-center">
                    <span>eligoleather.com</span>
                    <span className="text-amber-400">Official Store</span>
                  </div>
                </div>
              </div>
              {/* Laptop Base Stand */}
              <div className="relative w-[112%] -ml-[6%] h-3.5 bg-gradient-to-b from-neutral-300 to-neutral-400 rounded-b-[12px] shadow-lg border-t border-neutral-200 flex justify-center items-center">
                <div className="w-16 h-1 bg-neutral-500/40 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
