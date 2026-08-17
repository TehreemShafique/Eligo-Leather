"use client"

import Link from "next/link"
import { InstagramLogo, FacebookLogo, TwitterLogo, Question } from "@phosphor-icons/react"

export function ContactSocialSection() {
  return (
    <section className="py-16 font-['Manrope'] space-y-16">
      {/* Follow Eligo Leather */}
      <div>
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <h2 className="text-4xl sm:text-5xl font-bold text-black tracking-tight">
            Follow Eligo Leather
          </h2>
          <p className="text-gray-700 text-lg">
            Follow us for new arrivals, product launches, craftsmanship stories, exclusive offers, and behind-the-scenes content.
          </p>
        </div>

        {/* 3 Social Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Instagram Card */}
          <div className="bg-white rounded-3xl p-8 shadow-md border border-gray-100 flex flex-col items-center text-center space-y-4 hover:shadow-xl transition-shadow">
            <div className="w-20 h-20 bg-pink-600 rounded-full flex items-center justify-center text-white shadow-md">
              <InstagramLogo className="w-9 h-9" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-black">Instagram</h3>
              <p className="text-sm text-gray-500 font-normal">@eligoleather</p>
            </div>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-800 text-xs font-semibold uppercase tracking-wider hover:underline"
            >
              Follow
            </a>
          </div>

          {/* Facebook Card */}
          <div className="bg-white rounded-3xl p-8 shadow-md border border-gray-100 flex flex-col items-center text-center space-y-4 hover:shadow-xl transition-shadow">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-md">
              <FacebookLogo className="w-9 h-9" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-black">Facebook</h3>
              <p className="text-sm text-gray-500 font-normal">Eligo Leather</p>
            </div>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-800 text-xs font-semibold uppercase tracking-wider hover:underline"
            >
              Follow
            </a>
          </div>

          {/* Twitter Card */}
          <div className="bg-white rounded-3xl p-8 shadow-md border border-gray-100 flex flex-col items-center text-center space-y-4 hover:shadow-xl transition-shadow">
            <div className="w-20 h-20 bg-sky-500 rounded-full flex items-center justify-center text-white shadow-md">
              <TwitterLogo className="w-9 h-9" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-black">X (Twitter)</h3>
              <p className="text-sm text-gray-500 font-normal">@eligoleather</p>
            </div>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-800 text-xs font-semibold uppercase tracking-wider hover:underline"
            >
              Follow
            </a>
          </div>
        </div>
      </div>

      {/* Have Questions? FAQ Banner Card */}
      <div className="p-8 sm:p-12 bg-stone-300/80 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-8 shadow-inner">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-800/10 rounded-full flex items-center justify-center text-amber-800 shrink-0">
            <Question className="w-9 h-9" />
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl sm:text-3xl font-medium text-black">
              Have Questions?
            </h3>
            <p className="text-sm sm:text-base text-black/80 max-w-xl">
              Visit our FAQ page to find answers about shipping, returns, products, orders, warranty, and payments.
            </p>
          </div>
        </div>

        <Link
          href="/#faq-section"
          className="px-8 py-3.5 bg-amber-800 hover:bg-amber-900 text-stone-100 text-sm font-semibold rounded-[10px] uppercase tracking-wide shadow-md transition-colors font-['Manrope'] shrink-0 text-center"
        >
          Explore FAQ
        </Link>
      </div>
    </section>
  )
}
