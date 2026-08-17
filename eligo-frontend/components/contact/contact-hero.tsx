"use client"

import Image from "next/image"

export function ContactHero() {
  const scrollToForm = () => {
    const el = document.getElementById("contact-form-section")
    if (el) el.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section className="mb-16 font-['Manrope'] w-full max-w-[1680px] min-h-[550px] mx-auto">
      {/* Hero 2-Column Grid (1680px wide x 550px height frame) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center min-h-[550px]">
        {/* Left Column: We're Here to Help */}
        <div className="lg:col-span-5 flex flex-col justify-center space-y-6">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-black leading-tight">
            We&apos;re Here to Help
          </h2>

          <p className="text-gray-800 text-base sm:text-lg font-normal leading-relaxed max-w-lg">
            Whether you have questions about our products, need assistance with an order, or simply want to share your feedback, our team is always ready to assist you.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              type="button"
              onClick={scrollToForm}
              className="px-6 py-3.5 bg-amber-800 hover:bg-amber-900 text-white text-sm font-semibold rounded-[10px] shadow-sm transition-colors font-['Manrope'] cursor-pointer"
            >
              Send Us a Message
            </button>

            <a
              href="tel:+923345399470"
              className="px-6 py-3.5 border border-amber-800 text-amber-800 hover:bg-amber-800 hover:text-white text-sm font-semibold rounded-[10px] transition-colors font-['Manrope'] inline-block cursor-pointer"
            >
              Call Customer Support
            </a>
          </div>
        </div>

        {/* Right Column: 1100px x 550px Banner Box with 1px Amber Border matching Figma */}
        <div className="lg:col-span-7 relative w-full h-[350px] sm:h-[450px] lg:h-[550px] max-w-[1100px] rounded-[20px] border border-amber-800 overflow-hidden shadow-xs">
          <Image
            src="https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=1200"
            alt="Contact Us - Eligo Leather Artisanal Showcase"
            fill
            priority
            unoptimized
            className="object-cover object-center"
          />
        </div>
      </div>
    </section>
  )
}
